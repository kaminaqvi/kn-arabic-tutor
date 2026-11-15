import { db, kv, requestPersistence, exportData, importData } from './db.js';
import { today, addDays, daysBetween, newProgress, grade, newPerDay } from './srs.js';
import { speak, playUrl, listen, judge, canRecognize, hasArabicVoice, record, geminiFeedback, geminiChat, stripMarks } from './speech.js';
import { t, L, setLang, getLang } from './i18n.js';

const APP_VERSION = '3.2.0';
const APP_DATE = '2026-11-16';
const DEFAULT_MODEL = 'gemini-flash-latest';
const $app = document.getElementById('app');

// ---------- version and updates ----------
const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
async function checkUpdate() {
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    const j = await r.json();
    S.latest = j; S.updateReady = newer(j.version, APP_VERSION);
  } catch (e) { S.latest = null; S.updateReady = false; }
  return S.updateReady;
}
async function updateNow() {
  toast(t('updating'));
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map(r => r.update().catch(() => {})));
    const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k)));
  } catch (e) { /* reload anyway */ }
  location.reload();
}
const fmtDate = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString(getLang() === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d; } };
function versionHtml() {
  const latest = S.latest;
  const status = !latest ? t('ver_offline') : S.updateReady ? t('ver_update', { v: latest.version }) : t('ver_latest');
  return `<div class="version ${S.updateReady ? 'has-update' : ''}"><div><b>${t('ver_label', { v: APP_VERSION })}</b><small>${t('ver_released', { d: fmtDate(APP_DATE) })}. ${status}</small></div>
    ${S.updateReady ? `<button class="btn small primary" id="upd">${t('ver_update_btn')}</button>` : `<button class="btn small" id="chk">${t('ver_check')}</button>`}</div>`;
}
function wireVersion(rerender) {
  on('#upd', 'click', updateNow);
  on('#chk', 'click', async () => { await checkUpdate(); if (S.updateReady) rerender(); else toast(S.latest ? t('ver_latest') : t('ver_offline')); });
}

const S = {
  profile: null, settings: {}, index: null,
  items: new Map(), packs: {}, progress: new Map(),
};

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sample = (a, n) => shuffle(a).slice(0, n);
const showUrdu = () => S.profile && S.profile.lang !== 'en';

function render(html) { $app.innerHTML = html; window.scrollTo(0, 0); }
function on(sel, ev, fn) { $app.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn)); }
function toast(msg) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg;
  document.body.appendChild(d); setTimeout(() => d.remove(), 3200);
}

// Item as shown for this learner's form preference.
function view(item) {
  const fem = S.profile?.form === 'f' && item.ar_f;
  return { ar: fem ? item.ar_f : item.ar, tr: fem ? item.tr_f : item.tr, en: fem ? (item.en_f || item.en) : item.en };
}
function meaningHtml(item, v = view(item)) {
  if (item.kind === 'letter' || item.kind === 'mark') {
    return getLang() === 'ur' ? `<p class="mean">${esc(item.ur)}</p>` : `<p class="mean">${esc(item.en)}</p>${showUrdu() ? `<p class="mean-ur" dir="rtl" lang="ur">${esc(item.ur)}</p>` : ''}`;
  }
  if (getLang() === 'ur') return `<p class="mean" dir="rtl">${esc(item.ur)}</p>`;
  return `<p class="mean">${esc(v.en)}</p>${showUrdu() ? `<p class="mean-ur" dir="rtl" lang="ur">${esc(item.ur)}</p>` : ''}`;
}
function hookHtml(item) {
  if (!item.hook || !showUrdu()) return '';
  return `<div class="hook"><small>${t('hook')}</small>${esc(L(item.hook))}</div>`;
}
const hasAudio = item => item.kind === 'ayah' ? !!item.audio : !['letter'].includes(item.kind);
async function play(item, slow = false) {
  if (item.kind === 'ayah') return item.audio ? playUrl(item.audio) : toast(t('quran_offline'));
  if (!hasArabicVoice() && !play.warned) { play.warned = true; toast(t('voice_missing')); }
  return speak(view(item).ar, slow ? 0.55 : 0.8);
}

// ---------- content ----------
async function loadJSON(path) { const r = await fetch(path); if (!r.ok) throw new Error(path); return r.json(); }

async function loadContent() {
  S.index = await loadJSON('content/index.json');
  const files = [S.index.foundations, S.index.shared, ...S.index.paths.filter(p => p.available).map(p => p.file)];
  for (const f of files) {
    const pack = await loadJSON('content/' + f);
    S.packs[pack.id] = pack;
    pack.items.forEach(it => S.items.set(it.id, { ...it, pack: pack.id }));
  }
  await loadQuran();
}

// Qur'an text and audio come from AlQuran Cloud, never typed by hand. Cached on the device.
async function fetchAyahs(surah, refs) {
  // Whole surah when many ayahs are used; single ayahs otherwise.
  if (refs.length > 3) {
    const j = await (await fetch(`https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`)).json();
    return j.data.ayahs.map(a => ({ ref: `${surah}:${a.numberInSurah}`, text: a.text, audio: a.audio }));
  }
  const out = [];
  for (const ref of refs) {
    const j = await (await fetch(`https://api.alquran.cloud/v1/ayah/${ref}/ar.alafasy`)).json();
    out.push({ ref, text: j.data.text, audio: j.data.audio });
  }
  return out;
}
async function loadQuran() {
  const bySurah = {};
  for (const it of S.items.values()) if (it.quran) (bySurah[it.quran.split(':')[0]] ||= []).push(it.quran);
  for (const [surah, refs] of Object.entries(bySurah)) {
    const key = 'quran-' + surah + '-' + refs.length;
    let data = await kv.get(key);
    if (!data) {
      try { data = await fetchAyahs(surah, refs); await kv.set(key, data); } catch (e) { data = null; }
    }
    if (!data) continue;
    for (const it of S.items.values()) {
      if (!it.quran || it.quran.split(':')[0] !== surah) continue;
      const a = data.find(x => x.ref === it.quran);
      if (a) { it.ar = a.text; it.audio = a.audio; }
    }
  }
}

// The learner's ordered sequence of items: foundations (if needed) interleaved with chosen paths.
function sequence() {
  const lists = [];
  const p = S.profile;
  for (const pid of p.paths) {
    const pack = S.packs[pid];
    if (pack) lists.push(pack.units.flatMap(u => u.items));
  }
  if (!p.skipFoundations && S.packs.foundations) lists.unshift(S.packs.foundations.units.flatMap(u => u.items));
  const out = [];
  const idx = lists.map(() => 0);
  while (lists.some((l, i) => idx[i] < l.length)) {
    lists.forEach((l, i) => { if (idx[i] < l.length) out.push(l[idx[i]++]); });
  }
  return [...new Set(out)].filter(id => S.items.has(id) && (S.items.get(id).ar || S.items.get(id).quran));
}

// Items still to learn across the whole planned path (not only the content released so far), for pacing.
function plannedRemaining() {
  const ids = [...(S.profile.skipFoundations ? [] : ['foundations']), ...S.profile.paths];
  let total = 0;
  for (const id of ids) {
    const pack = S.packs[id]; if (!pack) continue;
    const ids = pack.units.flatMap(u => u.items);
    const learned = ids.filter(id => S.progress.has(id)).length;
    total += Math.max(ids.length, pack.planned || 0) - learned;
  }
  return total;
}

// ---------- persistence ----------
async function loadState() {
  S.profile = await kv.get('profile') || null;
  S.settings = await kv.get('settings') || {};
  const all = await db.all('progress');
  S.progress = new Map(all.map(p => [p.id, p]));
}
async function saveProfile() { await kv.set('profile', S.profile); }
async function saveSettings() { await kv.set('settings', S.settings); }

// ---------- design primitives ----------
const IC = {
  today: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.6 3.3 4.1-.7-.7 4.1 3.3 2.6-3.3 2.6.7 4.1-4.1-.7L12 21.5l-2.6-3.3-4.1.7.7-4.1L2.7 12.2 6 9.6l-.7-4.1 4.1.7z"/></svg>',
  practice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/></svg>',
  progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11M12 20V5M19 20v-6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" class="fill"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const icon = (name, cls = '') => `<span class="ic ${cls}">${IC[name]}</span>`;

// The eight-pointed star (khatam). Each point is one of the last 8 days; filled when practised.
function starSvg(days, centre, sub) {
  const cx = 100, cy = 100, R = 96, r = 62;
  const pt = (a, rad) => [cx + rad * Math.cos(a * Math.PI / 180), cy + rad * Math.sin(a * Math.PI / 180)];
  const tips = days.map((on, i) => {
    const a = -90 + (i - 7) * 45; // today at the top, earlier days running anticlockwise
    const [x0, y0] = pt(a, R), [x1, y1] = pt(a - 22.5, r), [x2, y2] = pt(a + 22.5, r);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x0.toFixed(1)} ${y0.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}Z" class="tip ${on ? 'on' : ''}"/>`;
  }).join('');
  const oct = Array.from({ length: 8 }, (_, i) => pt(-90 + 22.5 + i * 45, r).map(v => v.toFixed(1)).join(' ')).join(' L');
  return `<svg class="star" viewBox="0 0 200 200" role="img" aria-label="${esc(sub)}">${tips}<path d="M${oct}Z" class="core"/>
    <text x="100" y="104" class="star-n">${esc(centre)}</text><text x="100" y="130" class="star-sub">${esc(sub)}</text></svg>`;
}

function shell(tab, inner) {
  const tabs = [['today', 'tab_today', home], ['practice', 'tab_practice', practiceTab], ['progress', 'tab_progress', progressTab], ['settings', 'tab_settings', settings]];
  render(`<div class="shell"><main class="page">${inner}</main>
    <nav class="tabbar" aria-label="Main">${tabs.map(([id, label]) => `<button class="tab ${id === tab ? 'on' : ''}" data-tab="${id}" ${id === tab ? 'aria-current="page"' : ''}>${icon(id)}<span>${t(label)}</span></button>`).join('')}</nav></div>`);
  tabs.forEach(([id, , fn]) => on(`[data-tab="${id}"]`, 'click', fn));
}

function vibrate(ok) { try { navigator.vibrate && navigator.vibrate(ok ? 18 : [30, 40, 30]); } catch (e) {} }

// ---------- onboarding ----------
const OB = {};
function obScreen(title, body, { hint = '', back = null, next = 'next', nextLabel = t('next') } = {}) {
  render(`<div class="flow"><header class="flow-top">
      ${back ? `<button class="icon-btn" id="back" aria-label="${t('back')}">${icon('back')}</button>` : '<span class="icon-btn"></span>'}
      <div class="meter"><i style="width:${OB.pct || 0}%"></i></div><span class="icon-btn"></span></header>
    <section class="flow-body"><h1>${title}</h1>${hint ? `<p class="lead">${hint}</p>` : ''}${body}</section>
    ${next ? `<div class="dock"><p class="err" id="err" role="alert"></p><button class="btn primary" id="${next}">${nextLabel}</button></div>` : ''}</div>`);
  if (back) on('#back', 'click', back);
}

function startOnboarding() {
  OB.data = { lang: 'enur', paths: ['umrah'], skipFoundations: false, goalDate: null, minutes: 20, form: 'both' };
  setLang('en');
  render(`<div class="welcome">
    <div class="welcome-art"><div class="iqra ar" lang="ar">اقْرَأْ</div><p class="iqra-note">${t('welcome_caption')}</p></div>
    <div class="welcome-text"><h1>${t('welcome_title')}</h1><p class="lead">${t('welcome_body')}</p></div>
    <div class="dock"><button class="btn primary" id="go">${t('start')}</button></div></div>`);
  on('#go', 'click', obLang);
}

function tiles(name, options, selected, multi = false) {
  return `<div class="tiles-list" role="${multi ? 'group' : 'radiogroup'}">${options.map(o => `
    <label class="tile-opt ${o.disabled ? 'disabled' : ''}">
      <input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${esc(o.value)}" ${(multi ? selected.includes(o.value) : selected === o.value) ? 'checked' : ''} ${o.disabled ? 'disabled' : ''}>
      <span class="tile-text"><b>${o.label}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span>
      <span class="tick">${IC.check}</span></label>`).join('')}</div>`;
}

function obLang() {
  OB.pct = 12;
  obScreen(t('ob_lang_q'), tiles('lang', [
    { value: 'en', label: t('ob_lang_en') }, { value: 'enur', label: t('ob_lang_enur'), sub: t('ob_lang_enur_sub') }, { value: 'ur', label: t('ob_lang_ur') }], OB.data.lang), { back: startOnboarding });
  on('#next', 'click', () => {
    OB.data.lang = $app.querySelector('input[name=lang]:checked').value;
    setLang(OB.data.lang === 'ur' ? 'ur' : 'en');
    obPaths();
  });
}

function obPaths() {
  OB.pct = 26;
  const opts = S.index.paths.map(p => ({ value: p.id, label: esc(L(p.title)), sub: p.available ? esc(L(p.desc)) : t('coming_soon'), disabled: !p.available }));
  obScreen(t('ob_paths_q'), tiles('paths', opts, OB.data.paths, true), { hint: t('ob_paths_hint'), back: obLang });
  on('#next', 'click', () => {
    const v = [...$app.querySelectorAll('input[name=paths]:checked')].map(i => i.value);
    if (!v.length) { $app.querySelector('#err').textContent = t('ob_paths_hint'); return; }
    OB.data.paths = v; obLevel();
  });
}

function obLevel() {
  OB.pct = 40;
  obScreen(t('ob_level_q'), `<div class="tiles-list">
    <button class="tile-opt as-btn" id="quiz"><span class="tile-text"><b>${t('ob_level_quiz')}</b><small>${t('ob_level_quiz_hint')}</small></span></button>
    <button class="tile-opt as-btn" id="zero"><span class="tile-text"><b>${t('ob_level_zero')}</b><small>${t('ob_level_zero_sub')}</small></span></button></div>`, { back: obPaths, next: null });
  on('#zero', 'click', () => { OB.data.skipFoundations = false; obGoal(); });
  on('#quiz', 'click', () => placement(0, 0));
}

function placement(i, score) {
  const Q = S.index.placement;
  OB.pct = 40 + Math.round(10 * i / Q.length);
  if (i >= Q.length) {
    OB.data.skipFoundations = score >= Q.length - 1;
    obScreen(OB.data.skipFoundations ? t('placement_pass_title') : t('placement_fail_title'),
      `<p class="big-num">${score}<span>/${Q.length}</span></p><p class="lead">${OB.data.skipFoundations ? t('placement_pass') : t('placement_fail')}</p>`, { back: obLevel });
    on('#next', 'click', obGoal);
    return;
  }
  const [ar, ans, wrong] = Q[i];
  obScreen(t('placement_title'), `<div class="glyph ar" lang="ar">${esc(ar)}</div>
    <div class="answers">${shuffle([ans, ...wrong]).map(o => `<button class="answer" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
    <p class="hint center">${t('question_n', { i: i + 1, n: Q.length })}</p>`, { back: obLevel, next: null });
  on('.answer', 'click', e => placement(i + 1, score + (e.currentTarget.dataset.v === ans ? 1 : 0)));
}

function obGoal() {
  OB.pct = 56;
  const has = !!OB.data.goalDate;
  obScreen(t('ob_goal_q'), tiles('goal', [
    { value: 'none', label: t('ob_goal_none') }, { value: 'date', label: t('ob_goal_date') }], has ? 'date' : 'none') +
    `<input type="date" id="date" class="field ${has ? '' : 'hidden'}" min="${addDays(today(), 7)}" value="${OB.data.goalDate || ''}" aria-label="${t('ob_goal_date')}">`,
  { hint: t('ob_goal_hint'), back: obLevel });
  on('input[name=goal]', 'change', () => $app.querySelector('#date').classList.toggle('hidden', $app.querySelector('input[name=goal]:checked').value !== 'date'));
  on('#next', 'click', () => {
    const mode = $app.querySelector('input[name=goal]:checked').value;
    const d = $app.querySelector('#date').value;
    if (mode === 'date' && !d) { $app.querySelector('#err').textContent = t('ob_goal_pick'); return; }
    OB.data.goalDate = mode === 'date' ? d : null; obMinutes();
  });
}

function obMinutes() {
  OB.pct = 68;
  obScreen(t('ob_minutes_q'), tiles('min', [
    { value: '10', label: t('minutes_n', { n: 10 }), sub: t('min_10') },
    { value: '20', label: t('minutes_n', { n: 20 }), sub: t('min_20') },
    { value: '30', label: t('minutes_n', { n: 30 }), sub: t('min_30') }], String(OB.data.minutes)), { back: obGoal });
  on('#next', 'click', () => { OB.data.minutes = Number($app.querySelector('input[name=min]:checked').value); obForm(); });
}

function obForm() {
  OB.pct = 78;
  obScreen(t('ob_form_q'), tiles('form', [
    { value: 'm', label: t('form_m') }, { value: 'f', label: t('form_f') }, { value: 'both', label: t('form_both') }], OB.data.form), { hint: t('ob_form_hint'), back: obMinutes });
  on('#next', 'click', () => { OB.data.form = $app.querySelector('input[name=form]:checked').value; obKey(); });
}

function obKey() {
  OB.pct = 88;
  obScreen(t('ob_key_q'), `<input type="password" id="key" class="field" autocomplete="off" placeholder="${t('ob_key_placeholder')}" value="${esc(S.settings.geminiKey || '')}" aria-label="${t('set_key')}">
    <button class="btn text" id="skip">${t('ob_key_skip')}</button>`, { hint: t('ob_key_body'), back: obForm, next: 'save', nextLabel: t('save') });
  on('#skip', 'click', obMic);
  on('#save', 'click', async () => {
    S.settings.geminiKey = $app.querySelector('#key').value.trim();
    await saveSettings(); obMic();
  });
}

function obMic() {
  OB.pct = 100;
  obScreen(t('ob_mic_q'), `<div class="glyph ar" lang="ar">مَرْحَبَا</div><p class="center tr-line">marhaba</p>
    ${canRecognize ? `<button class="mic-orb" id="test" aria-label="${t('mic_test_btn')}">${icon('mic')}</button><p class="center hint">${t('mic_test_btn')}</p>` : `<p class="note warn">${t('mic_unsupported')}</p>`}
    <p id="res" class="center result-line" role="status"></p>`, { hint: t('ob_mic_body'), back: obKey, next: 'finish', nextLabel: t('done') });
  on('#test', 'click', async () => {
    const res = $app.querySelector('#res'), orb = $app.querySelector('#test');
    orb.classList.add('live'); res.className = 'center result-line'; res.textContent = t('listening');
    try { const alts = await listen(); res.textContent = t('mic_ok', { h: alts[0] }); res.classList.add('ok'); }
    catch (e) { res.textContent = t('mic_fail', { e: e.message }); res.classList.add('bad'); }
    orb.classList.remove('live');
  });
  on('#finish', 'click', finishOnboarding);
}

async function finishOnboarding() {
  S.profile = { ...OB.data, start: today(), streak: 0, xp: 0, schema: 1, created: new Date().toISOString() };
  if (!S.settings.model) S.settings.model = DEFAULT_MODEL;
  await saveProfile(); await saveSettings();
  await requestPersistence();
  home();
}

// ---------- today ----------
async function home() {
  setLang(S.profile.lang === 'ur' ? 'ur' : 'en');
  const st = await computeStats();
  const date = today();
  const dayN = daysBetween(S.profile.start, date) + 1;
  const due = [...S.progress.values()].filter(p => p.due <= date).length;
  const remainingIds = sequence().filter(id => !S.progress.has(id));
  const nNew = st.doneToday ? 0 : Math.min(remainingIds.length, newPerDay(S.profile, plannedRemaining(), date));
  const preview = remainingIds.slice(0, nNew).map(id => S.items.get(id)).filter(i => i && ['word', 'phrase', 'dua', 'sign'].includes(i.kind) && stripMarks(view(i).ar).length <= 14).slice(0, 3);
  const lastExport = await kv.get('lastExport');
  const needBackup = daysBetween(S.profile.start, date) >= 7 && (!lastExport || daysBetween(lastExport, date) >= 7);
  const left = S.profile.goalDate ? Math.max(0, daysBetween(date, S.profile.goalDate)) : null;
  const rehearsal = left !== null && left <= 5;
  const done8 = Array.from({ length: 8 }, (_, i) => st.dates.has(addDays(date, i - 7)));
  const mins = Math.max(5, Math.round((nNew * 60 + Math.min(due, 30) * 25) / 60));
  const notes = [];
  if (dayN % 7 === 0 && !st.doneToday) notes.push(`<div class="note brass">${t('boss_banner')}</div>`);
  if (rehearsal) notes.push(`<div class="note brass">${t('rehearsal_banner')}</div>`);
  if (needBackup) notes.push(`<div class="note"><span>${t('backup_reminder')}</span><button class="btn small" id="bk">${t('backup_now')}</button></div>`);

  shell('today', `
    <header class="today-head"><h1>${t('home_day', { n: dayN })}</h1><p class="lead">${left !== null ? t('home_goal_left', { n: left }) : t('home_no_goal')}</p></header>
    <section class="star-wrap">${starSvg(done8, st.streak, t('stat_streak'))}<p class="hint center">${t('star_caption')}</p></section>
    <section class="today-card ${st.doneToday ? 'done' : ''}">
      ${st.doneToday ? `<h2>${t('home_done_today')}</h2><p class="lead">${t('done_sub')}</p>
        ${remainingIds.length ? `<button class="btn primary" id="more">${t('learn_more')}</button>` : ''}
        <button class="btn" id="again">${t('home_again')}</button>`
      : `<h2>${t('today_level')}</h2>
        ${preview.length ? `<div class="preview" lang="ar" dir="rtl">${preview.map(i => `<span class="ar">${esc(view(i).ar)}</span>`).join('')}</div>` : ''}
        <p class="lead">${t('today_meta', { n: nNew, r: Math.min(due, 30), m: mins })}</p>
        <button class="btn primary" id="start">${t('home_start')}</button>`}
    </section>
    ${notes.join('')}
    ${matchMedia('(display-mode: standalone)').matches ? '' : `<p class="hint center install">${t('install_hint')}</p>`}
    <p class="hint center ver-line">${t('ver_label', { v: APP_VERSION })}</p>`);
  if (S.updateReady) { const n = document.createElement('div'); n.className = 'note update'; n.innerHTML = `<span>${t('ver_update', { v: S.latest.version })}</span><button class="btn small primary" id="upd2">${t('ver_update_btn')}</button>`; $app.querySelector('.today-head').after(n); on('#upd2', 'click', updateNow); }
  on('#start', 'click', () => startLevel(false));
  on('#again', 'click', () => startLevel(true));
  on('#more', 'click', () => startLevel(false, true));
  on('#bk', 'click', doExport);
}

// ---------- practice tab ----------
async function practiceTab() {
  const all = await loadRoleplays();
  const list = all.filter(sc => S.profile.paths.includes(sc.path));
  const scores = await kv.get('rp-scores') || {};
  const canTest = S.progress.size >= 20;
  shell('practice', `
    <header class="page-head"><h1>${t('tab_practice')}</h1><p class="lead">${t('practice_sub')}</p></header>
    <section class="group">
      <button class="row-btn" id="weak"><span><b>${t('practise_weak')}</b><small>${t('practise_weak_sub')}</small></span></button>
      <button class="row-btn" id="ft" ${canTest ? '' : 'aria-disabled="true"'}><span><b>${t('ft_title')}</b><small>${canTest ? t('ft_sub') : t('ft_locked')}</small></span></button>
    </section>
    <h2 class="group-title">${t('rp_title')}</h2>
    <p class="hint">${t('rp_desc')}</p>
    <section class="group">${list.map(sc => `
      <div class="rp-row">
        <button class="rp-main" data-rp="${sc.id}"><b>${esc(L(sc.title))}</b><small>${esc(L(sc.desc))}${scores[sc.id] != null ? ` <em class="best">${t('best', { n: scores[sc.id] })}</em>` : ''}</small></button>
        <button class="rp-gem" data-chat="${sc.id}" aria-label="${t('rp_free')}: ${esc(L(sc.title))}">${icon('chat')}<span>${t('rp_free_short')}</span></button>
      </div>`).join('') || `<p class="hint">${t('rp_none')}</p>`}</section>`);
  on('#weak', 'click', () => startLevel(true));
  on('#ft', 'click', () => canTest ? ftStart() : toast(t('ft_locked')));
  on('[data-rp]', 'click', e => rpPlay(list.find(x => x.id === e.currentTarget.dataset.rp), 0, 0));
  on('[data-chat]', 'click', e => rpChat(list.find(x => x.id === e.currentTarget.dataset.chat)));
}
const rpList = practiceTab;

// ---------- progress tab ----------
async function progressTab() {
  const st = await computeStats();
  const prog = [...S.progress.values()];
  const mastered = prog.filter(p => p.box >= 4).length;
  const boxes = [1, 2, 3, 4, 5].map(b => prog.filter(p => p.box === b).length);
  const maxBox = Math.max(1, ...boxes);
  const date = today();
  const days = Array.from({ length: 14 }, (_, i) => addDays(date, i - 13));
  const byDate = Object.fromEntries(st.log.map(l => [l.date, l]));
  const tests = await kv.get('final-tests') || [];
  shell('progress', `
    <header class="page-head"><h1>${t('tab_progress')}</h1></header>
    <section class="figures">
      <div><b>${st.streak}</b><span>${t('stat_streak')}</span></div>
      <div><b>${prog.length}</b><span>${t('fig_started')}</span></div>
      <div><b>${mastered}</b><span>${t('fig_mastered')}</span></div>
      <div><b>${st.xp}</b><span>XP</span></div>
    </section>
    <h2 class="group-title">${t('last14')}</h2>
    <section class="days">${days.map(d => { const l = byDate[d]; return `<div class="day-cell ${l ? (l.passed ? 'pass' : 'tried') : ''} ${d === date ? 'is-today' : ''}" title="${d}${l ? `: ${l.score}%` : ''}"><i></i><span>${Number(d.slice(8))}</span></div>`; }).join('')}</section>
    <h2 class="group-title">${t('home_readiness')}</h2>
    <section class="group">${pathReadiness().map(r => `
      <div class="path-row"><div class="path-line"><b>${esc(L(r.pack.title))}</b><span>${r.pct}%</span></div>
        <div class="bar"><i style="width:${r.pct}%"></i><s style="width:${r.total ? Math.round(100 * r.started / r.total) : 0}%"></s></div>
        <small>${t('path_progress', { s: r.started, n: r.total })}${r.current ? `. ${t('path_next')}: ${esc(L(r.current.title))}` : ''}</small></div>`).join('')}</section>
    <h2 class="group-title">${t('memory_title')}</h2>
    <p class="hint">${t('memory_sub')}</p>
    <section class="shelves">${boxes.map((n, i) => `<div class="shelf"><span class="shelf-name">${t('box_n', { n: i + 1 })}<small>${t('box_gap_' + (i + 1))}</small></span><div class="shelf-bar"><i style="width:${Math.round(100 * n / maxBox)}%"></i></div><b>${n}</b></div>`).join('')}</section>
    ${tests.length ? `<p class="hint">${t('ft_last', { s: tests[tests.length - 1].score })}</p>` : ''}
    <h2 class="group-title">${t('your_data')}</h2>
    <p class="hint">${t('your_data_sub')}</p>
    <section class="group">
      <button class="row-btn" id="exp"><span><b>${t('export_btn')}</b><small>${t('export_sub')}</small></span></button>
      <label class="row-btn"><span><b>${t('import_btn')}</b><small>${t('import_sub')}</small></span><input type="file" id="imp" accept="application/json,.json" hidden></label>
      <button class="row-btn" id="rep"><span><b>${t('report_btn')}</b><small>${t('report_sub')}</small></span></button>
    </section>`);
  on('#exp', 'click', doExport);
  on('#imp', 'change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { await importData(JSON.parse(await f.text())); await loadState(); toast(t('imported')); progressTab(); }
    catch (err) { toast(t('import_fail')); }
  });
  on('#rep', 'click', copyReport);
}

// ---------- level ----------
let LV = null;

function startLevel(practice, extra = false) {
  LV = buildLevel(practice, extra);
  if (!LV.rounds.length) { toast(t('nothing_to_practise')); return home(); }
  nextStep();
}

const ROUND_NAME = { review: 'round_review', learn: 'round_learn', read: 'round_read', listen: 'round_listen', speak: 'round_speak', build: 'round_build', meaning: 'round_meaning', plain: 'round_plain' };

function levelFrame(stage, dock) {
  const totalSteps = LV.rounds.reduce((s, r) => s + r.items.length, 0);
  const doneSteps = LV.rounds.slice(0, LV.r).reduce((s, r) => s + r.items.length, 0) + LV.i;
  const round = LV.rounds[LV.r];
  render(`<div class="flow level">
    <header class="flow-top"><button class="icon-btn" id="quit" aria-label="${t('close')}">${icon('close')}</button>
      <div class="meter" role="progressbar" aria-valuenow="${doneSteps}" aria-valuemax="${totalSteps}"><i style="width:${Math.round(100 * doneSteps / totalSteps)}%"></i></div>
      <span class="count">${doneSteps + 1}/${totalSteps}</span></header>
    <p class="round-name ${round.boss ? 'boss' : ''}">${round.boss ? t('round_boss') + ': ' : ''}${t(ROUND_NAME[round.type])}</p>
    <section class="stage">${stage}</section>
    <div class="dock" id="dock"><div class="verdict" id="fb" role="status"></div>${dock}</div></div>`);
  on('#quit', 'click', () => { if (confirm(t('quit_confirm'))) home(); });
}
function verdict(ok, html) {
  const dock = $app.querySelector('#dock');
  dock.classList.remove('ok', 'bad'); if (ok !== null) dock.classList.add(ok ? 'ok' : 'bad');
  $app.querySelector('#fb').innerHTML = html;
  if (ok !== null) vibrate(ok);
}

function nextStep() {
  const round = LV.rounds[LV.r];
  if (!round) return finishLevel();
  if (LV.i >= round.items.length) { LV.r++; LV.i = 0; return nextStep(); }
  const item = round.items[LV.i];
  ({ review: stepReview, learn: stepLearn, read: stepRead, listen: stepListen, speak: stepSpeak, build: stepBuild, meaning: stepMeaning, plain: stepPlain })[round.type](item);
}
function advance() { LV.i++; nextStep(); }

function audioButtons(item) {
  if (!hasAudio(item)) return '';
  return `<div class="audio"><button class="play" id="play" aria-label="${t('play')}">${icon('play')}</button>${item.kind !== 'ayah' ? `<button class="btn small ghost" id="slow">${t('play_slow')}</button>` : ''}</div>`;
}
function wireAudio(item) { on('#play', 'click', () => play(item)); on('#slow', 'click', () => play(item, true)); }

function formsHtml(item) {
  let h = '';
  if (item.ar_f && S.profile.form === 'both') {
    h += `<div class="forms"><div><small>${t('form_label_m')}</small><span class="ar" lang="ar">${esc(item.ar)}</span><em>${esc(item.tr)}</em></div>
      <div><small>${t('form_label_f')}</small><span class="ar" lang="ar">${esc(item.ar_f)}</span><em>${esc(item.tr_f)}</em></div></div>`;
  }
  if (item.msa) h += `<div class="msa"><small>${t('standard_form')}</small><span class="ar" lang="ar">${esc(item.msa)}</span></div>`;
  return h;
}

function glyphClass(item) { return item.kind === 'ayah' ? 'ayah ar' : item.kind === 'letter' ? 'letter ar' : (view(item).ar || '').length > 18 ? 'glyph long ar' : 'glyph ar'; }
function cardHtml(item, back = true) {
  const v = view(item);
  return `<div class="word">
    <div class="${glyphClass(item)}" lang="ar" dir="rtl">${esc(v.ar || '…')}</div>
    ${back ? `<p class="tr-line">${esc(item.kind === 'letter' ? item.tr : v.tr)}</p>${meaningHtml(item, v)}${formsHtml(item)}${hookHtml(item)}` : ''}
  </div>`;
}

function stepLearn(item) {
  levelFrame(`${cardHtml(item)}${audioButtons(item)}`, `<button class="btn primary" id="next">${t('continue')}</button>`);
  wireAudio(item);
  if (hasAudio(item)) play(item);
  on('#next', 'click', async () => { await markLearned(item); advance(); });
}

function stepReview(item) {
  levelFrame(`<p class="q">${t('review_q')}</p>${cardHtml(item, false)}<div id="back"></div>`,
    `<button class="btn primary" id="show">${t('show_answer')}</button>
     <div class="pair hidden" id="grade"><button class="btn" id="no">${t('didnt')}</button><button class="btn primary" id="yes">${t('knew')}</button></div>`);
  on('#show', 'click', () => {
    $app.querySelector('.stage').innerHTML = cardHtml(item, true) + audioButtons(item);
    wireAudio(item);
    $app.querySelector('#show').classList.add('hidden');
    $app.querySelector('#grade').classList.remove('hidden');
  });
  on('#yes', 'click', async () => { await answer(item, true); advance(); });
  on('#no', 'click', async () => { await answer(item, false); advance(); });
}

function optionsStep(item, promptHtml, correct, others, renderOpt, after) {
  const opts = shuffle([correct, ...others]);
  levelFrame(`${promptHtml}<div class="answers ${renderOpt.cls || ''}">${opts.map((o, k) => `<button class="answer" data-k="${k}">${renderOpt(o)}</button>`).join('')}</div>`,
    `<button class="btn primary hidden" id="next">${t('continue')}</button><p class="hint center" id="pick">${t('pick_one')}</p>`);
  let done = false;
  on('.answer', 'click', async e => {
    if (done) return; done = true;
    const k = Number(e.currentTarget.dataset.k);
    const ok = opts[k] === correct;
    $app.querySelectorAll('.answer').forEach((b, j) => { b.disabled = true; if (opts[j] === correct) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
    await answer(item, ok);
    verdict(ok, `<b>${ok ? t('correct') : t('not_quite')}</b>`);
    if (after) after(ok);
    $app.querySelector('#pick').classList.add('hidden');
    $app.querySelector('#next').classList.remove('hidden');
    $app.querySelector('#next').focus();
  });
  on('#next', 'click', advance);
}
const addDetail = html => { const fb = $app.querySelector('#fb'); fb.innerHTML += `<span>${html}</span>`; };

function stepRead(item) {
  const sameKind = [...S.items.values()].filter(i => i.kind === item.kind && i.id !== item.id);
  if (item.kind === 'letter') {
    const f = o => esc(getLang() === 'ur' ? o.ur : o.en);
    optionsStep(item, `<p class="q">${t('letter_sound')}</p><div class="letter ar" lang="ar">${esc(item.ar)}</div>`, item, sample(sameKind, 2), f, () => addDetail(`${esc(item.tr)}`));
  } else {
    optionsStep(item, `<p class="q">${t('reading_q')}</p><div class="glyph ar" lang="ar">${esc(item.ar)}</div>`, item, sample(sameKind.filter(o => o.tr !== item.tr), 2), o => esc(o.tr));
  }
}

function stepListen(item) {
  const group = item.kind === 'ayah' ? ['ayah'] : ['word', 'phrase', 'dua', 'sign'];
  const known = [...S.items.values()].filter(i => i.id !== item.id && group.includes(i.kind) && i.ar && view(i).ar !== view(item).ar);
  const pref = known.filter(i => S.progress.has(i.id));
  const f = o => `<span class="ar" lang="ar">${esc(view(o).ar)}</span>`;
  f.cls = 'arabic';
  optionsStep(item, `<p class="q">${t('tap_listen_pick')}</p><div class="audio big">${audioButtons(item).replace('<div class="audio">', '').replace(/<\/div>$/, '')}</div>`, item, sample(pref.length >= 2 ? pref : known, 2), f,
    () => addDetail(`${esc(view(item).tr)}: ${esc(getLang() === 'ur' ? item.ur : view(item).en)}`));
  wireAudio(item);
  setTimeout(() => play(item), 300);
}

function stepMeaning(item) {
  const group = item.kind === 'ayah' ? ['ayah'] : ['word', 'phrase', 'dua', 'sign'];
  const mean = o => getLang() === 'ur' ? o.ur : view(o).en;
  const others = sample([...S.items.values()].filter(i => i.id !== item.id && group.includes(i.kind) && mean(i) !== mean(item)), 2);
  optionsStep(item, `<p class="q">${t('pick_meaning')}</p><div class="${glyphClass(item)}" lang="ar">${esc(view(item).ar)}</div>`, item, others, o => esc(mean(o)), () => addDetail(esc(view(item).tr)));
}

function stepPlain(item) {
  const mean = o => getLang() === 'ur' ? o.ur : view(o).en;
  const others = sample([...S.items.values()].filter(i => i.id !== item.id && ['word', 'phrase', 'dua', 'sign'].includes(i.kind) && mean(i) !== mean(item)), 2);
  optionsStep(item, `<p class="q">${t('plain_q')}</p><div class="glyph plain ar" lang="ar">${esc(stripMarks(view(item).ar))}</div>`, item, others, o => esc(mean(o)),
    () => addDetail(`<span class="ar" lang="ar">${esc(view(item).ar)}</span> ${esc(view(item).tr)}`));
}

function wireFeedback(item) {
  on('#gem', 'click', async () => {
    const out = $app.querySelector('#gemout');
    if (!S.settings.geminiKey) { out.textContent = t('feedback_nokey'); return; }
    try {
      out.textContent = t('feedback_recording');
      const blob = await record(4000);
      out.textContent = t('feedback_wait');
      const txt = await geminiFeedback({ key: S.settings.geminiKey, model: S.settings.model || DEFAULT_MODEL, blob, item: { ...item, ...view(item) }, uiLang: getLang() });
      out.textContent = txt;
      const p = S.progress.get(item.id);
      if (p) { p.note = txt.slice(0, 300); await db.put('progress', p); }
    } catch (e) { out.textContent = t('gemini_error', { e: e.message }); }
  });
}

function stepSpeak(item) {
  const v = view(item);
  const targets = [v.ar, item.ar, item.ar_f, item.msa, ...(item.accept || [])].filter(Boolean);
  const threshold = ['ayah', 'dua'].includes(item.kind) ? 0.55 : 0.6;
  let tries = 0, finished = false;
  levelFrame(`${cardHtml(item)}${audioButtons(item)}
    <button class="mic-orb" id="mic" aria-label="${t('tap_mic')}">${icon('mic')}</button><p class="center hint" id="mic-hint">${t('tap_mic')}</p>
    ${S.settings.geminiKey ? `<button class="btn small ghost center-btn" id="gem">${t('feedback_btn')}</button><div id="gemout" class="gem" role="status"></div>` : ''}`,
    `<div class="pair"><button class="btn" id="skip">${t('skip_word')}</button><button class="btn primary hidden" id="next">${t('continue')}</button></div>`);
  wireAudio(item); wireFeedback(item);
  const end = async ok => {
    if (finished) return; finished = true;
    await answer(item, ok);
    $app.querySelector('#mic').disabled = true;
    $app.querySelector('#skip').classList.add('hidden');
    $app.querySelector('#next').classList.remove('hidden');
  };
  on('#mic', 'click', async () => {
    if (finished) return;
    const orb = $app.querySelector('#mic'); orb.classList.add('live'); orb.disabled = true;
    verdict(null, t('listening'));
    try {
      const alts = await listen();
      const j = judge(alts, targets, threshold);
      tries++;
      if (j.pass) { verdict(true, `<b>${t('correct')}</b><span>${t('heard', { h: esc(j.heard) })}</span>`); await end(true); }
      else {
        verdict(false, `<b>${tries >= 3 ? t('not_quite') : t('try_again')}</b><span>${t('heard', { h: esc(j.heard) })}</span>`);
        if (tries >= 3) await end(false);
      }
    } catch (e) { verdict(false, t('mic_fail', { e: e.message })); }
    orb.classList.remove('live'); if (!finished) orb.disabled = false;
  });
  on('#skip', 'click', () => end(false));
  on('#next', 'click', advance);
}

function stepBuild(item) {
  const v = view(item);
  const words = v.ar.split(/\s+/);
  const pool = [...S.items.values()].filter(i => i.id !== item.id && ['word', 'phrase'].includes(i.kind) && i.ar).flatMap(i => view(i).ar.split(/\s+/)).filter(w => !words.includes(w));
  const tiles = shuffle([...words, ...sample([...new Set(pool)], 2)]);
  let line = [];
  levelFrame(`<p class="q">${t('build_prompt')}</p><p class="build-mean">${esc(getLang() === 'ur' ? item.ur : v.en)}</p>
    <div class="line" id="line" dir="rtl" aria-label="${t('build_prompt')}"></div><div class="tiles" id="tiles" dir="rtl"></div>
    <div id="after" class="hidden">${audioButtons(item)}${canRecognize ? `<button class="mic-orb small" id="mic" aria-label="${t('say_sentence')}">${icon('mic')}</button><p class="center hint">${t('say_sentence')}</p>` : ''}</div>`,
    `<div class="pair" id="pre"><button class="btn" id="clear">${t('clear')}</button><button class="btn primary" id="check">${t('check')}</button></div>
     <button class="btn primary hidden" id="next">${t('continue')}</button>`);
  const draw = () => {
    $app.querySelector('#line').innerHTML = line.map((w, k) => `<button class="chip ar" lang="ar" data-l="${k}">${esc(w)}</button>`).join('');
    const used = [...line];
    $app.querySelector('#tiles').innerHTML = tiles.map((w, k) => {
      const u = used.indexOf(w); if (u >= 0) { used.splice(u, 1); return `<button class="chip ar used" lang="ar" disabled>${esc(w)}</button>`; }
      return `<button class="chip ar" lang="ar" data-t="${k}">${esc(w)}</button>`;
    }).join('');
    $app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { line.push(tiles[Number(b.dataset.t)]); draw(); });
    $app.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { line.splice(Number(b.dataset.l), 1); draw(); });
  };
  draw();
  let checked = false;
  on('#clear', 'click', () => { if (!checked) { line = []; draw(); } });
  on('#check', 'click', async () => {
    if (checked) return;
    if (!line.length) { verdict(null, t('build_empty')); return; }
    checked = true;
    const ok = line.join(' ') === words.join(' ');
    verdict(ok, ok ? `<b>${t('correct')}</b><span>${esc(v.tr)}</span>` : `<b>${t('not_quite')}</b><span class="ar" lang="ar">${esc(v.ar)}</span><span>${esc(v.tr)}</span>`);
    await answer(item, ok);
    $app.querySelector('#pre').classList.add('hidden');
    $app.querySelector('#next').classList.remove('hidden');
    $app.querySelector('#after').classList.remove('hidden');
    wireAudio(item);
    on('#mic', 'click', async () => {
      const orb = $app.querySelector('#mic'); orb.classList.add('live');
      try { const j = judge(await listen(), [v.ar, item.ar, item.ar_f].filter(Boolean), 0.6); addDetail(`${j.pass ? t('correct') : t('try_again')} ${t('heard', { h: esc(j.heard) })}`); }
      catch (e) { addDetail(t('mic_fail', { e: e.message })); }
      orb.classList.remove('live');
    });
  });
  on('#next', 'click', advance);
}

async function finishLevel() {
  const date = today();
  const score = LV.total ? Math.round(100 * LV.right / LV.total) : 100;
  const passed = score >= 80;
  const xp = LV.right * 10 + (passed ? 50 : 0) + (passed && LV.boss ? 100 : 0);
  const prev = await db.get('log', date);
  const minutes = Math.round((Date.now() - LV.started) / 60000);
  const rounds = Object.fromEntries(LV.rounds.map(r => [r.type, r.items.length]));
  const entry = prev ? { ...prev, score: Math.max(prev.score, score), passed: prev.passed || passed, xp: (prev.xp || 0) + xp, minutes: (prev.minutes || 0) + minutes, practice: (prev.practice || 0) + (LV.practice ? 1 : 0) }
    : { date, day: daysBetween(S.profile.start, date) + 1, score, passed, xp, minutes, learned: LV.fresh.size, rounds, practice: LV.practice ? 1 : 0, boss: LV.boss };
  await db.put('log', entry);
  const st = await computeStats();
  const done8 = Array.from({ length: 8 }, (_, i) => st.dates.has(addDays(date, i - 7)));
  const missed = [...LV.results.entries()].filter(([, r]) => !r.ok).map(([id]) => S.items.get(id)).filter(Boolean);
  render(`<div class="flow summary">
    <section class="stage">
      <div class="star-wrap small">${starSvg(done8, `${score}%`, t('summary_score'))}</div>
      <h1 class="center">${passed ? t('summary_pass_title') : t('summary_fail_title')}</h1>
      <p class="lead center">${passed ? t('summary_pass') : t('summary_fail')}</p>
      ${LV.boss && passed ? `<p class="note brass center">${t('summary_boss')}</p>` : ''}
      <section class="figures two"><div><b>+${xp}</b><span>XP</span></div><div><b>${LV.right}/${LV.total}</b><span>${t('summary_right')}</span></div></section>
      ${missed.length ? `<h2 class="group-title">${t('summary_missed')}</h2><ul class="missed">${missed.map(i => `<li><span class="ar" lang="ar">${esc(view(i).ar)}</span><span>${esc(view(i).tr)}</span></li>`).join('')}</ul>` : ''}
    </section>
    <div class="dock"><button class="btn primary" id="home">${t('continue')}</button></div></div>`);
  on('#home', 'click', home);
}

// ---------- role-plays ----------
async function loadRoleplays() {
  if (S.roleplays) return S.roleplays;
  try { S.roleplays = (await loadJSON('content/roleplays.json')).scenarios; } catch (e) { S.roleplays = []; }
  return S.roleplays;
}
function npcHtml(line) {
  return `<div class="bubble npc"><div class="ar" lang="ar" dir="rtl">${esc(line.ar)}</div><em>${esc(line.tr || '')}</em>
    <p>${esc(getLang() === 'ur' ? (line.ur || line.en) : line.en)}</p></div>`;
}

function rpPlay(sc, step, score) {
  if (step >= sc.steps.length) return rpDone(sc, score);
  const st = sc.steps[step];
  const exp = st.expect.map(id => S.items.get(id)).filter(Boolean);
  const targets = exp.flatMap(i => [view(i).ar, i.ar, i.ar_f, i.msa, ...(i.accept || [])]).filter(Boolean);
  let tries = 0, done = false;
  render(`<div class="flow level">
    <header class="flow-top"><button class="icon-btn" id="quit" aria-label="${t('close')}">${icon('close')}</button>
      <div class="meter"><i style="width:${Math.round(100 * step / sc.steps.length)}%"></i></div><span class="count">${step + 1}/${sc.steps.length}</span></header>
    <p class="round-name">${esc(L(sc.title))}</p>
    <section class="stage">
      ${npcHtml(st.npc)}
      <div class="audio"><button class="play" id="play" aria-label="${t('play')}">${icon('play')}</button></div>
      <p class="q">${t('rp_your_turn')}</p>
      <div id="hints" class="hidden">${exp.map(i => `<div class="bubble me"><div class="ar" lang="ar" dir="rtl">${esc(view(i).ar)}</div><em>${esc(view(i).tr)}</em><p>${esc(getLang() === 'ur' ? i.ur : view(i).en)}</p></div>`).join('')}</div>
      <button class="btn small ghost center-btn" id="hint">${t('rp_hint')}</button>
      ${canRecognize ? `<button class="mic-orb" id="mic" aria-label="${t('tap_mic')}">${icon('mic')}</button>` : `<p class="note warn">${t('mic_unsupported')}</p>`}
    </section>
    <div class="dock" id="dock"><div class="verdict" id="fb" role="status"></div>
      <div class="pair"><button class="btn" id="skip">${t('skip_word')}</button><button class="btn primary hidden" id="next">${t('continue')}</button></div></div></div>`);
  const say = () => speak(st.npc.ar);
  say();
  on('#play', 'click', say);
  on('#quit', 'click', practiceTab);
  on('#hint', 'click', () => { $app.querySelector('#hints').classList.remove('hidden'); $app.querySelector('#hint').classList.add('hidden'); });
  const finish = ok => {
    if (done) return; done = true; if (ok) score++;
    $app.querySelector('#hints').classList.remove('hidden'); $app.querySelector('#hint').classList.add('hidden');
    $app.querySelector('#mic')?.setAttribute('disabled', '');
    $app.querySelector('#skip').classList.add('hidden'); $app.querySelector('#next').classList.remove('hidden');
  };
  on('#mic', 'click', async () => {
    if (done) return;
    const orb = $app.querySelector('#mic'); orb.classList.add('live');
    verdict(null, t('listening'));
    try {
      const j = judge(await listen(), targets, 0.6); tries++;
      if (j.pass) { verdict(true, `<b>${t('correct')}</b><span>${t('heard', { h: esc(j.heard) })}</span>`); finish(true); }
      else { verdict(false, `<b>${t('try_again')}</b><span>${t('heard', { h: esc(j.heard) })}</span>`); if (tries >= 3) finish(false); }
    } catch (e) { verdict(false, t('mic_fail', { e: e.message })); }
    orb.classList.remove('live');
  });
  on('#skip', 'click', () => finish(false));
  on('#next', 'click', () => rpPlay(sc, step + 1, score));
}

async function rpDone(sc, score) {
  const pct = Math.round(100 * score / sc.steps.length);
  const scores = await kv.get('rp-scores') || {};
  scores[sc.id] = Math.max(scores[sc.id] || 0, pct);
  await kv.set('rp-scores', scores);
  render(`<div class="flow summary"><section class="stage">
    <p class="big-num center">${pct}<span>%</span></p>
    <h1 class="center">${esc(L(sc.title))}</h1>
    <p class="lead center">${pct >= 80 ? t('rp_passed') : t('rp_again')}</p></section>
    <div class="dock"><div class="pair"><button class="btn" id="again">${t('rp_retry')}</button><button class="btn primary" id="list">${t('continue')}</button></div></div></div>`);
  on('#again', 'click', () => rpPlay(sc, 0, 0));
  on('#list', 'click', practiceTab);
}

function rpChat(sc) {
  if (!S.settings.geminiKey) { toast(t('feedback_nokey')); return; }
  const history = [];
  render(`<div class="flow level chat">
    <header class="flow-top"><button class="icon-btn" id="quit" aria-label="${t('close')}">${icon('close')}</button><p class="round-name inline">${esc(L(sc.title))}</p><span class="icon-btn"></span></header>
    <section class="stage"><p class="hint center">${t('chat_intro')}</p><div id="log" class="log" aria-live="polite"></div></section>
    <div class="dock" id="dock"><div class="verdict" id="fb" role="status"></div>
      <div class="composer">${canRecognize ? `<button class="mic-orb small" id="mic" aria-label="${t('tap_mic')}">${icon('mic')}</button>` : ''}
        <input type="text" id="txt" class="field" dir="auto" placeholder="${t('rp_type_ph')}" aria-label="${t('rp_type_ph')}"><button class="btn primary small" id="send">${t('send')}</button></div>
      <button class="btn text" id="end">${t('rp_end')}</button></div></div>`);
  const log = $app.querySelector('#log');
  const addNpc = r => {
    const d = document.createElement('div');
    d.innerHTML = r.ar ? npcHtml(r) + (r.tip ? `<div class="hook"><small>${t('rp_tip')}</small>${esc(r.tip)}</div>` : '')
      : `<div class="note">${esc(getLang() === 'ur' ? (r.ur || r.en) : r.en)}</div>`;
    log.appendChild(d); d.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if (r.ar) speak(r.ar);
  };
  const addMe = text => { const d = document.createElement('div'); d.innerHTML = `<div class="bubble me"><p dir="auto">${esc(text)}</p></div>`; log.appendChild(d); };
  const send = async text => {
    if (!text) return;
    if (text !== '[START]' && text !== '[END]') addMe(text);
    history.push({ role: 'user', text });
    verdict(null, t('rp_thinking'));
    try {
      const r = await geminiChat({ key: S.settings.geminiKey, model: S.settings.model || DEFAULT_MODEL, system: rpSystem(sc), history });
      history.push({ role: 'model', text: JSON.stringify(r) });
      verdict(null, ''); addNpc(r);
    } catch (e) { verdict(false, t('gemini_error', { e: e.message })); history.pop(); }
  };
  send('[START]');
  on('#quit', 'click', practiceTab);
  on('#mic', 'click', async () => {
    const orb = $app.querySelector('#mic'); orb.classList.add('live'); verdict(null, t('listening'));
    try { const alts = await listen({ timeoutMs: 10000 }); await send(alts[0]); }
    catch (e) { verdict(false, t('mic_fail', { e: e.message })); }
    orb.classList.remove('live');
  });
  const sendTyped = () => { const i = $app.querySelector('#txt'); const v = i.value.trim(); i.value = ''; send(v); };
  on('#send', 'click', sendTyped);
  $app.querySelector('#txt').addEventListener('keydown', e => { if (e.key === 'Enter') sendTyped(); });
  on('#end', 'click', () => send('[END]'));
}

// ---------- final test ----------
function ftStart() {
  const learned = [...S.progress.keys()].map(id => S.items.get(id)).filter(i => i && ['word', 'phrase', 'dua', 'sign'].includes(i.kind));
  ftStep(sample(learned, 20), 0, 0, []);
}
function ftStep(items, i, right, missed) {
  if (i >= items.length) return ftDone(items.length, right, missed);
  const item = items[i]; let checked = false;
  render(`<div class="flow level">
    <header class="flow-top"><button class="icon-btn" id="quit" aria-label="${t('close')}">${icon('close')}</button>
      <div class="meter"><i style="width:${Math.round(100 * i / items.length)}%"></i></div><span class="count">${i + 1}/${items.length}</span></header>
    <p class="round-name">${t('ft_title')}</p>
    <section class="stage"><p class="q">${t('ft_q')}</p><div class="${glyphClass(item)}" lang="ar">${esc(view(item).ar)}</div>
      <input type="text" id="ans" class="field big" dir="auto" autocomplete="off" placeholder="${t('ft_ph')}" aria-label="${t('ft_ph')}"></section>
    <div class="dock" id="dock"><div class="verdict" id="fb" role="status"></div><button class="btn primary" id="go">${t('check')}</button></div></div>`);
  const input = $app.querySelector('#ans'); input.focus();
  const act = () => {
    if (!checked) {
      if (!input.value.trim()) { verdict(null, t('ft_empty')); return; }
      checked = true; input.disabled = true;
      const ok = checkTyped(item, input.value);
      if (ok) right++; else missed.push(item);
      verdict(ok, `<b>${ok ? t('correct') : t('not_quite')}</b><span>${esc(view(item).tr)}: ${esc(getLang() === 'ur' ? item.ur : view(item).en)}</span>`);
      $app.querySelector('#go').textContent = t('continue');
      return;
    }
    ftStep(items, i + 1, right, missed);
  };
  on('#go', 'click', act);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') act(); });
  on('#quit', 'click', practiceTab);
}
async function ftDone(n, right, missed) {
  const pct = n ? Math.round(100 * right / n) : 0;
  const tests = await kv.get('final-tests') || [];
  tests.push({ date: today(), score: pct, n });
  await kv.set('final-tests', tests);
  render(`<div class="flow summary"><section class="stage">
    <p class="big-num center">${pct}<span>%</span></p><h1 class="center">${t('ft_title')}</h1>
    <p class="lead center">${t('ft_result', { r: right, n })}</p>
    ${missed.length ? `<h2 class="group-title">${t('summary_missed')}</h2><ul class="missed">${missed.map(i => `<li><span class="ar" lang="ar">${esc(view(i).ar)}</span><span>${esc(getLang() === 'ur' ? i.ur : view(i).en)}</span></li>`).join('')}</ul>` : ''}</section>
    <div class="dock"><button class="btn primary" id="home">${t('continue')}</button></div></div>`);
  on('#home', 'click', practiceTab);
}

// ---------- settings ----------
function settings() {
  const p = S.profile;
  shell('settings', `
    <header class="page-head"><h1>${t('tab_settings')}</h1></header>
    <section class="group form">
      <label>${t('set_lang')}<select id="lang" class="field"><option value="en">${t('ob_lang_en')}</option><option value="enur">${t('ob_lang_enur')}</option><option value="ur">${t('ob_lang_ur')}</option></select></label>
      <label>${t('set_form')}<select id="form" class="field"><option value="m">${t('form_m')}</option><option value="f">${t('form_f')}</option><option value="both">${t('form_both')}</option></select></label>
      <label>${t('set_minutes')}<select id="min" class="field"><option value="10">${t('minutes_n', { n: 10 })}</option><option value="20">${t('minutes_n', { n: 20 })}</option><option value="30">${t('minutes_n', { n: 30 })}</option></select></label>
      <label>${t('set_goal')}<input type="date" id="goal" class="field" value="${esc(p.goalDate || '')}"></label>
    </section>
    <h2 class="group-title">${t('paths_label')}</h2>
    <section class="group form">${S.index.paths.map(x => `<label class="check"><input type="checkbox" name="paths" value="${x.id}" ${p.paths.includes(x.id) ? 'checked' : ''} ${x.available ? '' : 'disabled'}><span>${esc(L(x.title))}</span></label>`).join('')}
      <label class="check"><input type="checkbox" id="found" ${p.skipFoundations ? '' : 'checked'}><span>${t('path_foundations')}</span></label></section>
    <h2 class="group-title">${t('gemini_title')}</h2>
    <p class="hint">${t('ob_key_body')}</p>
    <section class="group form">
      <label>${t('set_key')}<input type="password" id="key" class="field" value="${esc(S.settings.geminiKey || '')}" autocomplete="off" placeholder="${t('ob_key_placeholder')}"></label>
      <label>${t('set_model')}<input type="text" id="model" class="field" value="${esc(S.settings.model || DEFAULT_MODEL)}"></label>
    </section>
    <button class="btn primary wide" id="save">${t('save_settings')}</button>
    <h2 class="group-title">${t('about_title')}</h2>
    ${versionHtml()}
    <p class="hint">${t('about_body')}</p>
    <button class="btn danger wide" id="reset">${t('reset_btn')}</button>`);
  wireVersion(settings);
  $app.querySelector('#lang').value = p.lang; $app.querySelector('#form').value = p.form; $app.querySelector('#min').value = String(p.minutes);
  on('#save', 'click', async () => {
    p.lang = $app.querySelector('#lang').value; p.form = $app.querySelector('#form').value;
    p.minutes = Number($app.querySelector('#min').value); p.goalDate = $app.querySelector('#goal').value || null;
    const paths = [...$app.querySelectorAll('input[name=paths]:checked')].map(i => i.value);
    if (paths.length) p.paths = paths;
    p.skipFoundations = !$app.querySelector('#found').checked;
    S.settings.geminiKey = $app.querySelector('#key').value.trim();
    S.settings.model = $app.querySelector('#model').value.trim() || DEFAULT_MODEL;
    await saveProfile(); await saveSettings();
    setLang(p.lang === 'ur' ? 'ur' : 'en'); toast(t('saved')); settings();
  });
  on('#reset', 'click', async () => {
    if (!confirm(t('reset_confirm'))) return;
    await db.clear('progress'); await db.clear('log'); await kv.set('profile', null);
    S.progress = new Map(); S.profile = null; startOnboarding();
  });
}

// ---------- logic ----------
async function computeStats() {
  const log = await db.all('log');
  const dates = new Set(log.filter(l => l.passed !== undefined).map(l => l.date));
  let streak = 0, d = today();
  if (!dates.has(d)) d = addDays(d, -1);
  while (dates.has(d)) { streak++; d = addDays(d, -1); }
  const xp = log.reduce((s, l) => s + (l.xp || 0), 0);
  return { log, streak, xp, dates, doneToday: dates.has(today()) };
}

function pathReadiness() {
  const ids = [...(S.profile.skipFoundations ? [] : ['foundations']), ...S.profile.paths];
  return ids.map(id => S.packs[id]).filter(Boolean).map(pack => {
    const items = [...new Set(pack.units.flatMap(u => u.items))].filter(id => S.items.has(id));
    const mastered = items.filter(id => (S.progress.get(id)?.box || 0) >= 4).length;
    const started = items.filter(id => S.progress.has(id)).length;
    const current = pack.units.find(u => u.items.some(id => !S.progress.has(id)));
    return { pack, pct: items.length ? Math.round(100 * mastered / items.length) : 0, started, total: items.length, current };
  });
}

function buildLevel(practice, extra = false) {
  const date = today();
  const due = [...S.progress.values()].filter(p => p.due <= date).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 30).map(p => S.items.get(p.id)).filter(Boolean);
  let fresh = [];
  if (!practice) {
    const remaining = sequence().filter(id => !S.progress.has(id));
    fresh = remaining.slice(0, newPerDay(S.profile, plannedRemaining(), date)).map(id => S.items.get(id));
  }
  let reviewItems = due;
  if (practice) {
    reviewItems = [...S.progress.values()].sort((a, b) => a.box - b.box || b.wrong - a.wrong).slice(0, 12).map(p => S.items.get(p.id)).filter(Boolean);
  }
  const pool = [...fresh, ...reviewItems];
  const speakable = pool.filter(i => ['word', 'phrase', 'dua', 'ayah', 'sign'].includes(i.kind) && i.ar);
  const readable = pool.filter(i => ['letter', 'mark', 'syllable'].includes(i.kind));
  const rounds = [];
  if (reviewItems.length) rounds.push({ type: 'review', items: reviewItems });
  if (fresh.length) rounds.push({ type: 'learn', items: fresh });
  if (readable.length) rounds.push({ type: 'read', items: sample(readable, 8) });
  const listenable = speakable.filter(hasAudio);
  if (listenable.length >= 1) rounds.push({ type: 'listen', items: sample(listenable, 5) });
  if (canRecognize && speakable.length) {
    const pick = [...speakable.filter(i => fresh.includes(i)), ...shuffle(speakable.filter(i => !fresh.includes(i)))].slice(0, 4);
    rounds.push({ type: 'speak', items: pick });
  }
  const meaningPool = pool.filter(i => ['word', 'phrase', 'dua', 'sign'].includes(i.kind) && !fresh.includes(i));
  if (meaningPool.length) rounds.push({ type: 'meaning', items: sample(meaningPool, 4) });
  const dayNum = daysBetween(S.profile.start, date) + 1;
  const plainPool = pool.filter(i => i.kind === 'sign' || (dayNum >= 15 && ['word', 'phrase'].includes(i.kind) && !fresh.includes(i)));
  if (plainPool.length) rounds.push({ type: 'plain', items: sample(plainPool, 4) });
  const buildable = speakable.filter(i => ['phrase', 'dua'].includes(i.kind) && view(i).ar.split(/\s+/).length >= 2);
  if (buildable.length) rounds.push({ type: 'build', items: sample(buildable, 3) });
  // Every 7th day: a boss level, a mixed meaning test of everything learned in the last 7 days.
  const dayN = daysBetween(S.profile.start, date) + 1;
  let boss = false;
  if (!practice && !extra && dayN % 7 === 0) {
    const since = addDays(date, -6);
    const week = [...S.progress.values()].filter(p => p.learned >= since).map(p => S.items.get(p.id)).filter(i => i && ['word', 'phrase', 'dua', 'ayah', 'sign'].includes(i.kind));
    if (week.length >= 4) { boss = true; rounds.push({ type: 'meaning', boss: true, items: sample(week, 12) }); }
  }
  return { practice, boss, rounds, fresh: new Set(fresh.map(i => i.id)), base: new Map(pool.map(i => [i.id, S.progress.get(i.id)])), results: new Map(), right: 0, total: 0, r: 0, i: 0, started: Date.now() };
}

// Record one graded answer and save the item's progress right away.
async function answer(item, correct) {
  LV.total++; if (correct) LV.right++;
  const prev = LV.results.get(item.id) || { ok: true, n: 0 };
  const res = { ok: prev.ok && correct, n: prev.n + 1 };
  LV.results.set(item.id, res);
  const date = today();
  const base = LV.base.get(item.id);
  let p;
  if (!base) {
    p = newProgress(item.id, date);
    p.right = res.ok ? res.n : 0; p.wrong = res.ok ? 0 : 1; p.last = res.ok ? 'right' : 'wrong';
  } else if (LV.practice || base.due > date) {
    // extra practice: only a wrong answer changes the schedule
    p = res.ok ? { ...base, seen: base.seen + 1, right: base.right + 1 } : grade(base, false, date, S.profile.goalDate);
  } else {
    p = grade(base, res.ok, date, S.profile.goalDate);
  }
  S.progress.set(item.id, p);
  await db.put('progress', p);
}
async function markLearned(item) {
  if (S.progress.has(item.id)) return;
  const p = newProgress(item.id, today());
  S.progress.set(item.id, p);
  await db.put('progress', p);
}

function rpSystem(sc) {
  return `You are role-playing a scene in Saudi Arabia. Your role: ${sc.persona}
The learner is a beginner in Arabic whose first language is Urdu or English, practising for Umrah and travel.
Rules: speak spoken Saudi (Hijazi) Arabic in very short, simple sentences (at most 10 words), always with full tashkeel (vowel marks).
Stay in your role, be realistic and kind, and move the scene forward with one simple question or statement at a time.
If the learner's last message has a mistake, or is in English or Urdu, put the correct Arabic they could have said in "tip" (with tashkeel and transliteration); otherwise "tip" is "".
Always reply with JSON only: {"ar": "your reply", "tr": "simple Latin transliteration", "en": "English meaning", "ur": "Urdu meaning", "tip": "..."}.
If the learner sends [END], reply with "ar": "" and put 2 or 3 short sentences of feedback on their Arabic in "en" and in "ur".`;
}

// Final recall test: type the meaning yourself, no choices.
const STOP = new Set('a an the to is are am i you he she it we they me my your our this that of for and or in on at be do does with very'.split(' '));
function keywords(item) {
  const en = view(item).en.toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z']+/).filter(w => w.length > 1 && !STOP.has(w));
  const ur = (item.ur || '').replace(/\([^)]*\)/g, ' ').split(/[\s،۔,/]+/).filter(w => w.length > 1);
  return { en: [...new Set(en)], ur: [...new Set(ur)] };
}
function checkTyped(item, typed) {
  const raw = typed.trim().toLowerCase();
  if ((item.accept || []).some(a => raw === a)) return true;
  const words = new Set(raw.split(/[^a-z'؀-ۿ0-9]+/).filter(Boolean));
  const k = keywords(item);
  const hit = list => list.length && list.filter(w => words.has(w) || [...words].some(x => x.length > 3 && (x.startsWith(w) || w.startsWith(x)))).length / list.length;
  return Math.max(hit(k.en) || 0, hit(k.ur) || 0) >= 0.5;
}

async function doExport() {
  const data = await exportData();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `kn-arabic-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  await kv.set('lastExport', today());
  toast(t('saved'));
}

async function buildReport() {
  const p = S.profile, date = today();
  const log = (await db.all('log')).sort((a, b) => a.date.localeCompare(b.date));
  const prog = [...S.progress.values()];
  const boxes = [1, 2, 3, 4, 5].map(b => prog.filter(x => x.box === b).length);
  const weak = prog.filter(x => x.wrong > 0).sort((a, b) => b.wrong - a.wrong || a.box - b.box).slice(0, 10)
    .map(x => { const i = S.items.get(x.id); return i ? `${view(i).ar} (${view(i).tr}) wrong ${x.wrong}, box ${x.box}` : x.id; });
  const st = await computeStats();
  const ready = pathReadiness().map(r => `${L(r.pack.title)} ${r.pct}% mastered (${r.started}/${r.total} started)`);
  return [
    `KN Arabic Tutor report — ${date} (v${APP_VERSION})`,
    `Day ${daysBetween(p.start, date) + 1} · paths: ${p.paths.join(', ')}${p.skipFoundations ? '' : ' + foundations'} · goal: ${p.goalDate || 'none'} · ${p.minutes} min/day · form: ${p.form}`,
    `Streak ${st.streak} · XP ${st.xp} · items started ${prog.length} · boxes 1-5: ${boxes.join('/')}`,
    `Last days: ${log.slice(-7).map(l => `${l.date.slice(5)} ${l.score}%${l.passed ? '' : '✗'}`).join(' | ') || '—'}`,
    `Readiness: ${ready.join(' · ') || '—'}`,
    `Weakest: ${weak.join('; ') || '—'}`,
    `Final tests: ${((await kv.get('final-tests')) || []).slice(-3).map(x => `${x.date.slice(5)} ${x.score}%`).join(' | ') || '—'} · Role-plays: ${Object.entries((await kv.get('rp-scores')) || {}).map(([k, v]) => `${k} ${v}%`).join(', ') || '—'}`,
  ].join('\n');
}
async function copyReport() {
  const txt = await buildReport();
  try { await navigator.clipboard.writeText(txt); toast(t('report_copied')); }
  catch (e) { prompt('', txt); }
}

// ---------- boot ----------
async function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  await loadState();
  setLang(S.profile?.lang === 'ur' ? 'ur' : 'en');
  try { await loadContent(); }
  catch (e) { render(`<main class="screen"><p class="warn">Could not load lessons. Check your connection and reload.</p></main>`); return; }
  if (!S.profile) startOnboarding(); else home();
  checkUpdate().then(ready => { if (ready && S.profile && $app.querySelector('.today-head')) home(); });
}

window.__kn = { S, buildReport, startLevel, home, rpList, ftStart, checkTyped, practiceTab, progressTab }; // for debugging and tests
boot();

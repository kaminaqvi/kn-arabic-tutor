import { db, kv, requestPersistence, exportData, importData } from './db.js';
import { today, addDays, daysBetween, newProgress, grade, newPerDay } from './srs.js';
import { speak, playUrl, listen, judge, canRecognize, hasArabicVoice, record, geminiFeedback } from './speech.js';
import { t, L, setLang, getLang } from './i18n.js';

const APP_VERSION = '1.1.0';
const DEFAULT_MODEL = 'gemini-flash-latest';
const $app = document.getElementById('app');

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
    return getLang() === 'ur' ? `<div class="mean">${esc(item.ur)}</div>` : `<div class="mean">${esc(item.en)}</div>${showUrdu() ? `<div class="mean-ur" dir="rtl">${esc(item.ur)}</div>` : ''}`;
  }
  if (getLang() === 'ur') return `<div class="mean" dir="rtl">${esc(item.ur)}</div>`;
  return `<div class="mean">${esc(v.en)}</div>${showUrdu() ? `<div class="mean-ur" dir="rtl">${esc(item.ur)}</div>` : ''}`;
}
function hookHtml(item) {
  if (!item.hook || !showUrdu()) return '';
  return `<div class="hook"><span class="label">${t('hook')}</span>${esc(L(item.hook))}</div>`;
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
  const files = [S.index.foundations, ...S.index.paths.filter(p => p.available).map(p => p.file)];
  for (const f of files) {
    const pack = await loadJSON('content/' + f);
    S.packs[pack.id] = pack;
    pack.items.forEach(it => S.items.set(it.id, { ...it, pack: pack.id }));
  }
  await loadQuran();
}

// Qur'an text and audio come from AlQuran Cloud, never typed by hand. Cached on the device.
async function loadQuran() {
  const surahs = new Set([...S.items.values()].filter(i => i.quran).map(i => i.quran.split(':')[0]));
  for (const s of surahs) {
    let data = await kv.get('quran-' + s);
    if (!data) {
      try {
        const r = await fetch(`https://api.alquran.cloud/v1/surah/${s}/ar.alafasy`);
        const j = await r.json();
        data = j.data.ayahs.map(a => ({ n: a.numberInSurah, text: a.text, audio: a.audio }));
        await kv.set('quran-' + s, data);
      } catch (e) { data = null; }
    }
    if (!data) continue;
    for (const it of S.items.values()) {
      if (!it.quran || it.quran.split(':')[0] !== s) continue;
      const a = data.find(x => x.n === Number(it.quran.split(':')[1]));
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
  return out.filter(id => S.items.has(id) && (S.items.get(id).ar || S.items.get(id).quran));
}

// Items still to learn across the whole planned path (not only the content released so far), for pacing.
function plannedRemaining() {
  const ids = [...(S.profile.skipFoundations ? [] : ['foundations']), ...S.profile.paths];
  let total = 0;
  for (const id of ids) {
    const pack = S.packs[id]; if (!pack) continue;
    const learned = pack.items.filter(i => S.progress.has(i.id)).length;
    total += Math.max(pack.items.length, pack.planned || 0) - learned;
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

// ---------- onboarding ----------
const OB = {};
function obScreen(title, body, hint = '') {
  render(`<main class="screen onboard">
    <div class="ob-progress"><span style="width:${OB.pct || 0}%"></span></div>
    <h1>${title}</h1>${hint ? `<p class="hint">${hint}</p>` : ''}
    <div class="ob-body">${body}</div></main>`);
}

function startOnboarding() {
  OB.data = { lang: 'enur', paths: ['umrah'], skipFoundations: false, goalDate: null, minutes: 20, form: 'both' };
  setLang('en');
  render(`<main class="screen welcome">
    <div class="logo ar">ع</div>
    <h1>${t('welcome_title')}</h1><p class="lead">${t('welcome_body')}</p>
    <button class="btn primary big" id="go">${t('start')}</button></main>`);
  on('#go', 'click', obLang);
}

function choiceList(name, options, selected, multi = false) {
  return `<div class="choices">${options.map(o => `
    <label class="choice ${o.disabled ? 'disabled' : ''}">
      <input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${esc(o.value)}" ${(multi ? selected.includes(o.value) : selected === o.value) ? 'checked' : ''} ${o.disabled ? 'disabled' : ''}>
      <span><b>${o.label}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span></label>`).join('')}</div>`;
}
const navButtons = (backFn = true) => `<div class="row">${backFn ? `<button class="btn" id="back">${t('back')}</button>` : ''}<button class="btn primary" id="next">${t('next')}</button></div>`;

function obLang() {
  OB.pct = 10;
  obScreen(t('ob_lang_q'), choiceList('lang', [
    { value: 'en', label: t('ob_lang_en') }, { value: 'enur', label: t('ob_lang_enur') }, { value: 'ur', label: t('ob_lang_ur') }], OB.data.lang) + navButtons(false));
  on('#next', 'click', () => {
    OB.data.lang = $app.querySelector('input[name=lang]:checked').value;
    setLang(OB.data.lang === 'ur' ? 'ur' : 'en');
    obPaths();
  });
}

function obPaths() {
  OB.pct = 25;
  const opts = S.index.paths.map(p => ({ value: p.id, label: esc(L(p.title)), sub: p.available ? esc(L(p.desc)) : `${t('coming_soon')} · ${esc(p.eta)}`, disabled: !p.available }));
  obScreen(t('ob_paths_q'), choiceList('paths', opts, OB.data.paths, true) + `<p class="err" id="err"></p>` + navButtons(), t('ob_paths_hint'));
  on('#back', 'click', obLang);
  on('#next', 'click', () => {
    const v = [...$app.querySelectorAll('input[name=paths]:checked')].map(i => i.value);
    if (!v.length) { $app.querySelector('#err').textContent = t('ob_paths_hint'); return; }
    OB.data.paths = v; obLevel();
  });
}

function obLevel() {
  OB.pct = 40;
  obScreen(t('ob_level_q'), `<div class="stack">
    <button class="btn primary big" id="quiz">${t('ob_level_quiz')}</button>
    <button class="btn big" id="zero">${t('ob_level_zero')}</button></div>
    <div class="row"><button class="btn" id="back">${t('back')}</button></div>`, t('ob_level_quiz_hint'));
  on('#back', 'click', obPaths);
  on('#zero', 'click', () => { OB.data.skipFoundations = false; obGoal(); });
  on('#quiz', 'click', () => placement(0, 0));
}

function placement(i, score) {
  const Q = S.index.placement;
  if (i >= Q.length) {
    OB.data.skipFoundations = score >= Q.length - 1;
    obScreen(t('placement_title'), `<p class="result">${score} / ${Q.length}</p><p>${OB.data.skipFoundations ? t('placement_pass') : t('placement_fail')}</p>${navButtons()}`);
    on('#back', 'click', obLevel); on('#next', 'click', obGoal);
    return;
  }
  const [ar, ans, wrong] = Q[i];
  obScreen(t('placement_title'), `<div class="big-ar ar">${esc(ar)}</div>
    <div class="options">${shuffle([ans, ...wrong]).map(o => `<button class="btn opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
    <p class="hint">${i + 1} / ${Q.length}</p>`);
  on('.opt', 'click', e => placement(i + 1, score + (e.currentTarget.dataset.v === ans ? 1 : 0)));
}

function obGoal() {
  OB.pct = 55;
  const has = !!OB.data.goalDate;
  obScreen(t('ob_goal_q'), choiceList('goal', [
    { value: 'none', label: t('ob_goal_none') }, { value: 'date', label: t('ob_goal_date') }], has ? 'date' : 'none') +
    `<input type="date" id="date" min="${addDays(today(), 7)}" value="${OB.data.goalDate || ''}" class="${has ? '' : 'hidden'}">
    <p class="err" id="err"></p>` + navButtons(), t('ob_goal_hint'));
  on('input[name=goal]', 'change', () => $app.querySelector('#date').classList.toggle('hidden', $app.querySelector('input[name=goal]:checked').value !== 'date'));
  on('#back', 'click', obLevel);
  on('#next', 'click', () => {
    const mode = $app.querySelector('input[name=goal]:checked').value;
    const d = $app.querySelector('#date').value;
    if (mode === 'date' && !d) { $app.querySelector('#err').textContent = t('ob_goal_date'); return; }
    OB.data.goalDate = mode === 'date' ? d : null; obMinutes();
  });
}

function obMinutes() {
  OB.pct = 65;
  obScreen(t('ob_minutes_q'), choiceList('min', [10, 20, 30].map(n => ({ value: String(n), label: t('minutes_n', { n }) })), String(OB.data.minutes)) + navButtons());
  on('#back', 'click', obGoal);
  on('#next', 'click', () => { OB.data.minutes = Number($app.querySelector('input[name=min]:checked').value); obForm(); });
}

function obForm() {
  OB.pct = 75;
  obScreen(t('ob_form_q'), choiceList('form', [
    { value: 'm', label: t('form_m') }, { value: 'f', label: t('form_f') }, { value: 'both', label: t('form_both') }], OB.data.form) + navButtons(), t('ob_form_hint'));
  on('#back', 'click', obMinutes);
  on('#next', 'click', () => { OB.data.form = $app.querySelector('input[name=form]:checked').value; obKey(); });
}

function obKey() {
  OB.pct = 85;
  obScreen(t('ob_key_q'), `<input type="password" id="key" autocomplete="off" placeholder="${t('ob_key_placeholder')}" value="${esc(S.settings.geminiKey || '')}">
    <div class="row"><button class="btn" id="back">${t('back')}</button><button class="btn" id="skip">${t('ob_key_skip')}</button><button class="btn primary" id="save">${t('save')}</button></div>`, t('ob_key_body'));
  on('#back', 'click', obForm);
  on('#skip', 'click', obMic);
  on('#save', 'click', async () => {
    S.settings.geminiKey = $app.querySelector('#key').value.trim();
    await saveSettings(); obMic();
  });
}

function obMic() {
  OB.pct = 95;
  obScreen(t('ob_mic_q'), `<div class="big-ar ar">مَرْحَبَا</div>
    ${canRecognize ? `<button class="btn primary big" id="test"><span class="mic"></span>${t('mic_test_btn')}</button>` : `<p class="warn">${t('mic_unsupported')}</p>`}
    <p id="res" class="hint"></p>
    <div class="row"><button class="btn" id="back">${t('back')}</button><button class="btn primary" id="finish">${t('done')}</button></div>`, t('ob_mic_body'));
  on('#back', 'click', obKey);
  on('#test', 'click', async () => {
    const res = $app.querySelector('#res'); res.textContent = t('listening');
    try { const alts = await listen(); res.textContent = t('mic_ok', { h: alts[0] }); res.className = 'ok'; }
    catch (e) { res.textContent = t('mic_fail', { e: e.message }); res.className = 'warn'; }
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

// ---------- home ----------
async function computeStats() {
  const log = await db.all('log');
  const dates = new Set(log.filter(l => l.passed !== undefined).map(l => l.date));
  let streak = 0, d = today();
  if (!dates.has(d)) d = addDays(d, -1);
  while (dates.has(d)) { streak++; d = addDays(d, -1); }
  const xp = log.reduce((s, l) => s + (l.xp || 0), 0);
  return { log, streak, xp, doneToday: dates.has(today()) };
}

function unitReadiness() {
  const out = [];
  const packs = [...(S.profile.skipFoundations ? [] : ['foundations']), ...S.profile.paths].map(id => S.packs[id]).filter(Boolean);
  for (const p of packs) for (const u of p.units) {
    const ids = u.items.filter(id => S.items.has(id));
    const mastered = ids.filter(id => (S.progress.get(id)?.box || 0) >= 4).length;
    const started = ids.some(id => S.progress.has(id));
    out.push({ pack: p, unit: u, pct: ids.length ? Math.round(100 * mastered / ids.length) : 0, started });
  }
  return out;
}

async function home() {
  setLang(S.profile.lang === 'ur' ? 'ur' : 'en');
  const st = await computeStats();
  const date = today();
  const dayN = daysBetween(S.profile.start, date) + 1;
  const due = [...S.progress.values()].filter(p => p.due <= date).length;
  const remaining = sequence().filter(id => !S.progress.has(id)).length;
  const nNew = Math.min(remaining, newPerDay(S.profile, plannedRemaining(), date));
  const lastExport = await kv.get('lastExport');
  const needBackup = daysBetween(S.profile.start, date) >= 7 && (!lastExport || daysBetween(lastExport, date) >= 7);
  const goal = S.profile.goalDate ? t('home_goal_left', { n: Math.max(0, daysBetween(date, S.profile.goalDate)) }) : t('home_no_goal');
  const ready = unitReadiness().filter(r => r.started);
  render(`<main class="screen home">
    <header class="top"><div><div class="day">${t('home_day', { n: dayN })}</div><div class="hint">${goal}</div></div>
      <button class="icon-btn" id="settings" aria-label="${t('home_settings')}">⚙</button></header>
    <section class="stats">
      <div class="stat"><b>${st.streak}</b><span>${t('stat_streak')}</span></div>
      <div class="stat"><b>${st.xp}</b><span>XP</span></div>
      <div class="stat"><b>${due}</b><span>${t('stat_due')}</span></div>
      <div class="stat"><b>${st.doneToday ? 0 : nNew}</b><span>${t('stat_new')}</span></div>
    </section>
    ${dayN % 7 === 0 && !st.doneToday ? `<div class="banner boss-banner">${t('boss_banner')}</div>` : ''}
    ${needBackup ? `<div class="banner">${t('backup_reminder')} <button class="btn small" id="bk">${t('backup_now')}</button></div>` : ''}
    ${st.doneToday ? `<p class="ok center">${t('home_done_today')}</p><button class="btn big" id="again">${t('home_again')}</button>`
      : `<button class="btn primary big" id="start">${t('home_start')}</button>`}
    ${ready.length ? `<section class="ready"><h2>${t('home_readiness')}</h2>${ready.map(r => `
      <div class="bar-row"><span>${esc(L(r.unit.title))}</span><div class="bar"><i style="width:${r.pct}%"></i></div><b>${r.pct}%</b></div>`).join('')}</section>` : ''}
    <p class="hint center">${t('install_hint')}</p>
  </main>`);
  on('#settings', 'click', settings);
  on('#start', 'click', () => startLevel(false));
  on('#again', 'click', () => startLevel(true));
  on('#bk', 'click', doExport);
}

// ---------- level ----------
let LV = null;

function buildLevel(practice) {
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
  const speakable = pool.filter(i => ['word', 'phrase', 'dua', 'ayah'].includes(i.kind) && i.ar);
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
  const meaningPool = pool.filter(i => ['word', 'phrase', 'dua'].includes(i.kind) && !fresh.includes(i));
  if (meaningPool.length) rounds.push({ type: 'meaning', items: sample(meaningPool, 4) });
  const buildable = speakable.filter(i => ['phrase', 'dua'].includes(i.kind) && view(i).ar.split(/\s+/).length >= 2);
  if (buildable.length) rounds.push({ type: 'build', items: sample(buildable, 3) });
  // Every 7th day: a boss level, a mixed meaning test of everything learned in the last 7 days.
  const dayN = daysBetween(S.profile.start, date) + 1;
  let boss = false;
  if (!practice && dayN % 7 === 0) {
    const since = addDays(date, -6);
    const week = [...S.progress.values()].filter(p => p.learned >= since).map(p => S.items.get(p.id)).filter(i => i && ['word', 'phrase', 'dua', 'ayah'].includes(i.kind));
    if (week.length >= 4) { boss = true; rounds.push({ type: 'meaning', boss: true, items: sample(week, 12) }); }
  }
  return { practice, boss, rounds, fresh: new Set(fresh.map(i => i.id)), base: new Map(pool.map(i => [i.id, S.progress.get(i.id)])), results: new Map(), right: 0, total: 0, r: 0, i: 0, started: Date.now() };
}

function startLevel(practice) {
  LV = buildLevel(practice);
  if (!LV.rounds.length) { toast('—'); return home(); }
  nextStep();
}

const ROUND_NAME = { review: 'round_review', learn: 'round_learn', read: 'round_read', listen: 'round_listen', speak: 'round_speak', build: 'round_build', meaning: 'round_meaning' };

function levelFrame(inner) {
  const totalSteps = LV.rounds.reduce((s, r) => s + r.items.length, 0);
  const doneSteps = LV.rounds.slice(0, LV.r).reduce((s, r) => s + r.items.length, 0) + LV.i;
  render(`<main class="screen level">
    <header class="lv-top"><button class="icon-btn" id="quit" aria-label="Close">✕</button>
      <div class="lv-bar"><i style="width:${Math.round(100 * doneSteps / totalSteps)}%"></i></div></header>
    <div class="round-name">${LV.rounds[LV.r].boss ? `<span class="boss">${t('round_boss')}</span> · ` : ''}${t(ROUND_NAME[LV.rounds[LV.r].type])}</div>
    ${inner}</main>`);
  on('#quit', 'click', home);
}

function nextStep() {
  const round = LV.rounds[LV.r];
  if (!round) return finishLevel();
  if (LV.i >= round.items.length) { LV.r++; LV.i = 0; return nextStep(); }
  const item = round.items[LV.i];
  ({ review: stepReview, learn: stepLearn, read: stepRead, listen: stepListen, speak: stepSpeak, build: stepBuild, meaning: stepMeaning })[round.type](item);
}
function advance() { LV.i++; nextStep(); }

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

function audioButtons(item) {
  if (!hasAudio(item)) return '';
  return `<div class="audio"><button class="btn round" id="play" aria-label="${t('play')}">▶</button>${item.kind !== 'ayah' ? `<button class="btn small" id="slow">${t('play_slow')}</button>` : ''}</div>`;
}
function wireAudio(item) { on('#play', 'click', () => play(item)); on('#slow', 'click', () => play(item, true)); }

function formsHtml(item) {
  let h = '';
  if (item.ar_f && S.profile.form === 'both') {
    h += `<div class="forms"><div><span class="label">${t('form_label_m')}</span><span class="ar">${esc(item.ar)}</span><small>${esc(item.tr)}</small></div>
      <div><span class="label">${t('form_label_f')}</span><span class="ar">${esc(item.ar_f)}</span><small>${esc(item.tr_f)}</small></div></div>`;
  }
  if (item.msa) h += `<div class="msa"><span class="label">${t('standard_form')}</span><span class="ar">${esc(item.msa)}</span></div>`;
  return h;
}

function cardHtml(item, back = true) {
  const v = view(item);
  const arClass = item.kind === 'ayah' ? 'ayah ar' : (item.kind === 'letter' ? 'letter ar' : 'big-ar ar');
  return `<div class="card">
    <div class="${arClass}">${esc(v.ar || '…')}</div>
    ${back ? `<div class="tr">${esc(item.kind === 'letter' ? item.tr : v.tr)}</div>${meaningHtml(item, v)}${formsHtml(item)}${hookHtml(item)}` : ''}
  </div>`;
}

function stepLearn(item) {
  levelFrame(`${cardHtml(item)}${audioButtons(item)}<button class="btn primary big" id="next">${t('next')}</button>`);
  wireAudio(item);
  if (hasAudio(item)) play(item);
  on('#next', 'click', async () => { await markLearned(item); advance(); });
}

function stepReview(item) {
  levelFrame(`${cardHtml(item, false)}<div id="backside"></div>
    <button class="btn primary big" id="show">${t('show_answer')}</button>
    <div class="row hidden" id="grade"><button class="btn bad" id="no">${t('didnt')}</button><button class="btn good" id="yes">${t('knew')}</button></div>`);
  on('#show', 'click', () => {
    $app.querySelector('.card').outerHTML = cardHtml(item, true) + audioButtons(item);
    wireAudio(item);
    $app.querySelector('#show').classList.add('hidden');
    $app.querySelector('#grade').classList.remove('hidden');
  });
  on('#yes', 'click', async () => { await answer(item, true); advance(); });
  on('#no', 'click', async () => { await answer(item, false); advance(); });
}

function optionsStep(item, promptHtml, correct, others, renderOpt, after) {
  const opts = shuffle([correct, ...others]);
  levelFrame(`${promptHtml}<div class="options">${opts.map((o, k) => `<button class="btn opt ${renderOpt.cls || ''}" data-k="${k}">${renderOpt(o)}</button>`).join('')}</div>
    <p id="fb" class="fb"></p><button class="btn primary big hidden" id="next">${t('next')}</button>`);
  let done = false;
  on('.opt', 'click', async e => {
    if (done) return; done = true;
    const k = Number(e.currentTarget.dataset.k);
    const ok = opts[k] === correct;
    $app.querySelectorAll('.opt').forEach((b, j) => { if (opts[j] === correct) b.classList.add('good'); else if (j === k) b.classList.add('bad'); });
    await answer(item, ok);
    if (after) after(ok);
    $app.querySelector('#next').classList.remove('hidden');
  });
  on('#next', 'click', advance);
}

function stepRead(item) {
  const sameKind = [...S.items.values()].filter(i => i.kind === item.kind && i.id !== item.id);
  if (item.kind === 'letter') {
    const others = sample(sameKind, 2);
    const f = o => esc(getLang() === 'ur' ? o.ur : o.en);
    optionsStep(item, `<p class="q">${t('letter_sound')}</p><div class="letter ar">${esc(item.ar)}</div>`, item, others, f);
  } else {
    const others = sample(sameKind.filter(o => o.tr !== item.tr), 2);
    optionsStep(item, `<p class="q">${t('reading_q')}</p><div class="big-ar ar">${esc(item.ar)}</div>`, item, others, o => esc(o.tr));
  }
}

function stepListen(item) {
  const group = item.kind === 'ayah' ? ['ayah'] : ['word', 'phrase', 'dua'];
  const known = [...S.items.values()].filter(i => i.id !== item.id && group.includes(i.kind) && i.ar && view(i).ar !== view(item).ar);
  const pref = known.filter(i => S.progress.has(i.id));
  const others = sample(pref.length >= 2 ? pref : known, 2);
  const f = o => `<span class="ar">${esc(view(o).ar)}</span>`;
  f.cls = 'ar-opt';
  optionsStep(item, `<p class="q">${t('tap_listen_pick')}</p>${audioButtons(item)}`, item, others, f, () => {
    $app.querySelector('#fb').innerHTML = `${esc(view(item).tr)} — ${esc(getLang() === 'ur' ? item.ur : view(item).en)}`;
  });
  wireAudio(item);
  setTimeout(() => play(item), 300);
}

function stepMeaning(item) {
  const group = item.kind === 'ayah' ? ['ayah'] : ['word', 'phrase', 'dua'];
  const mean = o => getLang() === 'ur' ? o.ur : view(o).en;
  const others = sample([...S.items.values()].filter(i => i.id !== item.id && group.includes(i.kind) && mean(i) !== mean(item)), 2);
  const arClass = item.kind === 'ayah' ? 'ayah ar' : 'big-ar ar';
  optionsStep(item, `<p class="q">${t('pick_meaning')}</p><div class="card"><div class="${arClass}">${esc(view(item).ar)}</div></div>`, item, others, o => esc(mean(o)), () => {
    $app.querySelector('#fb').textContent = view(item).tr;
  });
}

function feedbackHtml() {
  return `<button class="btn small" id="gem">${t('feedback_btn')}</button><div id="gemout" class="gem"></div>`;
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
    } catch (e) { out.textContent = e.message; }
  });
}

function stepSpeak(item) {
  const v = view(item);
  const targets = [v.ar, item.ar, item.ar_f, item.msa, ...(item.accept || [])].filter(Boolean);
  const threshold = ['ayah', 'dua'].includes(item.kind) ? 0.55 : 0.6;
  let tries = 0, finished = false;
  levelFrame(`${cardHtml(item)}${audioButtons(item)}
    <button class="btn primary big mic-btn" id="mic"><span class="mic"></span>${t('tap_mic')}</button>
    <p id="fb" class="fb"></p>
    ${feedbackHtml()}
    <div class="row"><button class="btn" id="skip">${t('skip_word')}</button><button class="btn primary hidden" id="next">${t('next')}</button></div>`);
  wireAudio(item); wireFeedback(item);
  const fb = () => $app.querySelector('#fb');
  const end = async ok => {
    if (finished) return; finished = true;
    await answer(item, ok);
    $app.querySelector('#mic').classList.add('hidden');
    $app.querySelector('#skip').classList.add('hidden');
    $app.querySelector('#next').classList.remove('hidden');
  };
  on('#mic', 'click', async () => {
    if (finished) return;
    const btn = $app.querySelector('#mic'); btn.disabled = true; fb().className = 'fb'; fb().textContent = t('listening');
    try {
      const alts = await listen();
      const j = judge(alts, targets, threshold);
      tries++;
      if (j.pass) { fb().className = 'fb ok'; fb().textContent = `${t('correct')} · ${t('heard', { h: j.heard })}`; await end(true); }
      else {
        fb().className = 'fb bad'; fb().textContent = `${t('try_again')} ${t('heard', { h: j.heard })}`;
        if (tries >= 3) await end(false);
      }
    } catch (e) { fb().className = 'fb bad'; fb().textContent = t('mic_fail', { e: e.message }); }
    btn.disabled = false;
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
  levelFrame(`<p class="q">${t('build_prompt')}</p><div class="card"><div class="mean">${esc(getLang() === 'ur' ? item.ur : v.en)}</div></div>
    <div class="line ar" id="line" dir="rtl"></div><div class="tiles" id="tiles" dir="rtl"></div>
    <p id="fb" class="fb"></p>
    <div class="row"><button class="btn" id="clear">${t('clear')}</button><button class="btn primary" id="check">${t('check')}</button></div>
    <div id="after" class="hidden">${audioButtons(item)}<p class="q">${t('say_sentence')}</p>${canRecognize ? `<button class="btn mic-btn" id="mic"><span class="mic"></span>${t('tap_mic')}</button>` : ''}<p id="fb2" class="fb"></p>
    <button class="btn primary big" id="next">${t('next')}</button></div>`);
  const draw = () => {
    $app.querySelector('#line').innerHTML = line.map((w, k) => `<button class="tile ar" data-l="${k}">${esc(w)}</button>`).join('');
    const used = [...line];
    $app.querySelector('#tiles').innerHTML = tiles.map((w, k) => {
      const u = used.indexOf(w); if (u >= 0) { used.splice(u, 1); return `<button class="tile ar used" disabled>${esc(w)}</button>`; }
      return `<button class="tile ar" data-t="${k}">${esc(w)}</button>`;
    }).join('');
    $app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { line.push(tiles[Number(b.dataset.t)]); draw(); });
    $app.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { line.splice(Number(b.dataset.l), 1); draw(); });
  };
  draw();
  let checked = false;
  on('#clear', 'click', () => { if (!checked) { line = []; draw(); } });
  on('#check', 'click', async () => {
    if (checked) return;
    if (!line.length) { $app.querySelector('#fb').textContent = t('build_prompt'); return; }
    checked = true;
    const ok = line.join(' ') === words.join(' ');
    const fb = $app.querySelector('#fb');
    fb.className = ok ? 'fb ok' : 'fb bad';
    fb.innerHTML = ok ? `${t('correct')} · ${esc(v.tr)}` : `<span class="ar">${esc(v.ar)}</span><br>${esc(v.tr)}`;
    await answer(item, ok);
    $app.querySelector('#clear').parentElement.classList.add('hidden');
    $app.querySelector('#after').classList.remove('hidden');
    wireAudio(item);
    on('#mic', 'click', async () => {
      const f2 = $app.querySelector('#fb2'); f2.textContent = t('listening');
      try { const j = judge(await listen(), [v.ar, item.ar, item.ar_f].filter(Boolean), 0.6); f2.className = j.pass ? 'fb ok' : 'fb bad'; f2.textContent = `${j.pass ? t('correct') : t('try_again')} ${t('heard', { h: j.heard })}`; }
      catch (e) { f2.textContent = t('mic_fail', { e: e.message }); }
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
  const missed = [...LV.results.entries()].filter(([, r]) => !r.ok).map(([id]) => S.items.get(id));
  render(`<main class="screen summary">
    <h1>${t('summary_title')}</h1>
    <div class="score ${passed ? 'ok' : 'bad'}">${score}%</div>
    <p>${passed ? t('summary_pass') : t('summary_fail')}</p>${LV.boss && passed ? `<p class="ok"><b>${t('summary_boss')}</b></p>` : ''}
    <div class="stats"><div class="stat"><b>+${xp}</b><span>${t('summary_xp')}</span></div><div class="stat"><b>${LV.right}/${LV.total}</b><span>${t('summary_score')}</span></div></div>
    ${missed.length ? `<h2>${t('summary_missed')}</h2><ul class="missed">${missed.map(i => `<li><span class="ar">${esc(view(i).ar)}</span> — ${esc(view(i).tr)}</li>`).join('')}</ul>` : ''}
    <button class="btn primary big" id="home">${t('home_btn')}</button></main>`);
  on('#home', 'click', home);
}

// ---------- settings, backup, report ----------
function settings() {
  const p = S.profile;
  render(`<main class="screen settings">
    <header class="top"><button class="icon-btn" id="back" aria-label="${t('back')}">←</button><h1>${t('settings_title')}</h1></header>
    <label>${t('set_lang')}<select id="lang"><option value="en">${t('ob_lang_en')}</option><option value="enur">${t('ob_lang_enur')}</option><option value="ur">${t('ob_lang_ur')}</option></select></label>
    <label>${t('set_form')}<select id="form"><option value="m">${t('form_m')}</option><option value="f">${t('form_f')}</option><option value="both">${t('form_both')}</option></select></label>
    <label>${t('set_minutes')}<select id="min"><option>10</option><option>20</option><option>30</option></select></label>
    <label>${t('set_goal')}<input type="date" id="goal" value="${esc(p.goalDate || '')}"></label>
    <fieldset><legend>${t('paths_label')}</legend>${S.index.paths.map(x => `<label class="inline"><input type="checkbox" name="paths" value="${x.id}" ${p.paths.includes(x.id) ? 'checked' : ''} ${x.available ? '' : 'disabled'}> ${esc(L(x.title))}${x.available ? '' : ` <small>(${t('coming_soon')})</small>`}</label>`).join('')}
      <label class="inline"><input type="checkbox" id="found" ${p.skipFoundations ? '' : 'checked'}> ${t('path_foundations')}</label></fieldset>
    <label>${t('set_key')}<input type="password" id="key" value="${esc(S.settings.geminiKey || '')}" autocomplete="off" placeholder="${t('ob_key_placeholder')}"></label>
    <label>${t('set_model')}<input type="text" id="model" value="${esc(S.settings.model || DEFAULT_MODEL)}"></label>
    <button class="btn primary big" id="save">${t('save')}</button>
    <hr>
    <button class="btn big" id="exp">${t('export_btn')}</button>
    <label class="btn big file">${t('import_btn')}<input type="file" id="imp" accept="application/json,.json" hidden></label>
    <button class="btn big" id="rep">${t('report_btn')}</button>
    <hr>
    <h2>${t('about_title')}</h2><p class="hint">${t('about_body')} v${APP_VERSION}</p>
    <button class="btn bad" id="reset">${t('reset_btn')}</button>
  </main>`);
  $app.querySelector('#lang').value = p.lang; $app.querySelector('#form').value = p.form; $app.querySelector('#min').value = String(p.minutes);
  on('#back', 'click', home);
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
  on('#exp', 'click', doExport);
  on('#imp', 'change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { await importData(JSON.parse(await f.text())); await loadState(); toast(t('imported')); home(); }
    catch (err) { toast(t('import_fail')); }
  });
  on('#rep', 'click', copyReport);
  on('#reset', 'click', async () => {
    if (!confirm(t('reset_confirm'))) return;
    await db.clear('progress'); await db.clear('log'); await kv.set('profile', null);
    S.progress = new Map(); S.profile = null; startOnboarding();
  });
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
  const ready = unitReadiness().filter(r => r.started).map(r => `${L(r.unit.title)} ${r.pct}%`);
  return [
    `KN Arabic Tutor report — ${date} (v${APP_VERSION})`,
    `Day ${daysBetween(p.start, date) + 1} · paths: ${p.paths.join(', ')}${p.skipFoundations ? '' : ' + foundations'} · goal: ${p.goalDate || 'none'} · ${p.minutes} min/day · form: ${p.form}`,
    `Streak ${st.streak} · XP ${st.xp} · items started ${prog.length} · boxes 1-5: ${boxes.join('/')}`,
    `Last days: ${log.slice(-7).map(l => `${l.date.slice(5)} ${l.score}%${l.passed ? '' : '✗'}`).join(' | ') || '—'}`,
    `Readiness: ${ready.join(' · ') || '—'}`,
    `Weakest: ${weak.join('; ') || '—'}`,
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
}

window.__kn = { S, buildReport, startLevel, home }; // for debugging and tests
boot();

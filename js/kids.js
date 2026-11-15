// KN Arabic Kids: a separate, picture-led app with its own saved progress (database "kn-arabic-kids").
// No accounts, no chat, no AI. A parent gate protects settings.
import { db, kv, requestPersistence, exportData, importData } from './db.js';
import { today, newProgress, grade } from './srs.js';
import { speak, playUrl, listen, judge, canRecognize, hasArabicVoice } from './speech.js';

const KIDS_VERSION = '1.2.0';
const setMode = m => { try { localStorage.setItem('kn-mode', m); } catch (e) {} };
const $app = document.getElementById('app');
const K = { profile: null, items: new Map(), pack: null, progress: new Map(), units: {}, stickers: [] };

// ---------- words for the interface (English and Urdu) ----------
const STR = {
  en: {
    hello: 'Marhaba!', intro: 'Let’s learn Arabic together with pictures, sounds and stars.', go: 'Let’s go',
    parents_note: 'For parents: progress stays on this phone. No accounts, no ads, no chat.',
    your_name: 'What’s your name?', name_ph: 'Your name', pick_buddy: 'Pick a buddy', help_lang: 'Help language', start: 'Start',
    hi: 'Hi, {n}!', hi_anon: 'Hi there!', stars: 'stars', stickers: 'Stickers', play: 'Play', locked: 'Locked',
    learn_this: 'Listen and say it', next: 'Next', which_pic: 'Which picture is this?', which_word: 'Find the word',
    which_letter: 'Which one starts with this letter?', say_it: 'Say it!', say_hint: 'Tap the microphone and say the word',
    great: ['Shabash!', 'Ahsant!', 'Super!', 'Mumtaz!', 'Well done!'], try_again: 'Try again!', heard: 'I heard: {h}',
    skip: 'Skip', level_done: 'Level complete!', you_got: 'You got {n} stars', you_got_1: 'You got 1 star', new_sticker: 'New sticker!',
    back_map: 'Back to map', sticker_book: 'My sticker book', sticker_count: '{n} of {t} collected',
    parent_hold: 'Grown-ups: hold for 2 seconds', parents: 'For parents', lang: 'Help language', sounds: 'Sound effects',
    on: 'On', off: 'Off', export: 'Save a backup file', import: 'Restore from a backup file', reset: 'Start again from zero',
    reset_confirm: 'Delete all of this child’s progress on this phone?', adult_app: 'Switch profile', close: 'Close',
    version: 'Kids version {v}', saved: 'Saved', imported: 'Backup restored', import_fail: 'That file is not a kids backup.',
    no_voice: 'Install an Arabic voice: phone Settings → Text-to-speech → Install voice data → Arabic.',
    quran_offline: 'Connect to the internet once to download the Qur’an recitation.', mic_fail: 'I could not hear you. Try again!',
    tap_to_hear: 'Tap to hear', unit_n: 'Level {n}', play_again: 'Play again', save_btn: 'Save', child_name: 'Child\u2019s name',
  },
  ur: {
    hello: 'مرحبا!', intro: 'آؤ تصویروں، آوازوں اور ستاروں کے ساتھ عربی سیکھیں۔', go: 'چلو شروع کریں',
    parents_note: 'والدین کے لیے: پیش رفت صرف اسی فون پر رہتی ہے۔ نہ اکاؤنٹ، نہ اشتہار، نہ چیٹ۔',
    your_name: 'تمہارا نام کیا ہے؟', name_ph: 'اپنا نام', pick_buddy: 'اپنا دوست چنو', help_lang: 'مدد کی زبان', start: 'شروع کرو',
    hi: 'السلام علیکم، {n}!', hi_anon: 'السلام علیکم!', stars: 'ستارے', stickers: 'اسٹیکر', play: 'کھیلو', locked: 'بند',
    learn_this: 'سنو اور بولو', next: 'آگے', which_pic: 'یہ کون سی تصویر ہے؟', which_word: 'لفظ ڈھونڈو',
    which_letter: 'کون سا اس حرف سے شروع ہوتا ہے؟', say_it: 'بولو!', say_hint: 'مائیک دباؤ اور لفظ بولو',
    great: ['شاباش!', 'أحسنت!', 'زبردست!', 'ممتاز!', 'بہت خوب!'], try_again: 'پھر سے کوشش کرو!', heard: 'میں نے سنا: {h}',
    skip: 'چھوڑو', level_done: 'لیول مکمل!', you_got: 'تمہیں {n} ستارے ملے', you_got_1: 'تمہیں 1 ستارہ ملا', new_sticker: 'نیا اسٹیکر!',
    back_map: 'نقشے پر واپس', sticker_book: 'میری اسٹیکر بک', sticker_count: '{t} میں سے {n} جمع',
    parent_hold: 'بڑوں کے لیے: 2 سیکنڈ دبائے رکھیں', parents: 'والدین کے لیے', lang: 'مدد کی زبان', sounds: 'آوازیں',
    on: 'آن', off: 'آف', export: 'بیک اپ فائل محفوظ کریں', import: 'بیک اپ فائل سے بحال کریں', reset: 'شروع سے دوبارہ',
    reset_confirm: 'اس فون سے بچے کی تمام پیش رفت مٹا دیں؟', adult_app: 'پروفائل بدلیں', close: 'بند کریں',
    version: 'بچوں کا ورژن {v}', saved: 'محفوظ ہو گیا', imported: 'بیک اپ بحال ہو گیا', import_fail: 'یہ بچوں کی بیک اپ فائل نہیں ہے۔',
    no_voice: 'عربی آواز انسٹال کریں: فون کی Settings ← Text-to-speech ← Install voice data ← Arabic',
    quran_offline: 'قرآن کی تلاوت ڈاؤن لوڈ کرنے کے لیے ایک بار انٹرنیٹ سے جڑیں۔', mic_fail: 'آواز نہیں آئی۔ پھر سے کوشش کرو!',
    tap_to_hear: 'سننے کے لیے دباؤ', unit_n: 'لیول {n}', play_again: 'پھر کھیلو', save_btn: 'محفوظ کریں', child_name: 'بچے کا نام',
  },
};
let lang = 'en';
function setLang(l) { lang = l === 'ur' ? 'ur' : 'en'; document.documentElement.lang = lang; document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'; }
const t = (k, v = {}) => String(STR[lang][k] ?? STR.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
const pick = a => a[Math.floor(Math.random() * a.length)];
const cheer = () => pick(STR[lang].great);
const L = v => (v && typeof v === 'object') ? (lang === 'ur' && v.ur ? v.ur : v.en) : (v || '');
const mean = it => lang === 'ur' ? it.ur : it.en;

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sample = (a, n) => shuffle(a).slice(0, n);
function render(html) { $app.innerHTML = html; window.scrollTo(0, 0); }
function on(sel, ev, fn) { $app.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn)); }
function toast(msg) { const d = document.createElement('div'); d.className = 'k-toast'; d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000); }

// Little sounds made in the browser, so they work offline.
let actx = null;
function chime(ok) {
  if (K.profile && K.profile.sounds === false) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = ok ? [660, 880, 1320] : [300, 220];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = ok ? 'triangle' : 'sine'; o.frequency.value = f;
      const t0 = actx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + 0.3);
    });
  } catch (e) { /* no sound */ }
  try { navigator.vibrate && navigator.vibrate(ok ? 15 : [25, 30, 25]); } catch (e) {}
}

let warned = false;
function sayWord(it, slow = false) {
  if (it.kind === 'ayah') return it.audio ? playUrl(it.audio) : toast(t('quran_offline'));
  if (!hasArabicVoice() && !warned) { warned = true; toast(t('no_voice')); }
  return speak(it.ar, slow ? 0.5 : 0.7);
}

// Jamal the camel, the app's buddy.
const JAMAL = `<svg class="jamal" viewBox="0 0 220 190" role="img" aria-label="Jamal the camel">
  <ellipse cx="105" cy="178" rx="70" ry="7" class="j-shadow"/>
  <path d="M48 120c-6 22-4 40-2 52M70 128c-2 20 0 34 2 44M128 128c2 20 0 34-2 44M150 120c6 22 4 40 2 52" class="j-leg"/>
  <path d="M30 118c0-30 22-44 40-44 6-22 22-30 32-30s24 10 30 30c18 2 36 14 36 40 0 22-30 30-70 30s-68-6-68-26z" class="j-body"/>
  <path d="M158 104c8-14 10-36 12-56" class="j-neck"/>
  <ellipse cx="180" cy="44" rx="24" ry="18" class="j-head"/>
  <path d="M166 30l-4-10 10 6z" class="j-head"/>
  <circle cx="186" cy="40" r="4.5" class="j-eye"/><circle cx="187.5" cy="38.5" r="1.4" class="j-shine"/>
  <circle cx="192" cy="52" r="4" class="j-cheek"/>
  <path d="M196 47c3 3 3 7 0 9" class="j-smile"/>
  <path d="M30 116c-10 2-14 10-12 18" class="j-tail"/>
</svg>`;

const BUDDIES = ['🐪', '🦁', '🐱', '🦊', '🐼', '🐢'];
const STICKERS = ['🐪', '🦁', '🐼', '🐬', '🦄', '🐢', '🦋', '🐞', '🌈', '🚀', '🌵', '🍉', '🧁', '🏆', '🎈', '🦜', '🐠', '🦒', '🐘', '🌙', '⭐', '🍭', '🎁', '🕌', '🐝', '🦉', '🐧', '🌻', '🍓', '⚽'];

// ---------- content ----------
async function loadJSON(p) { const r = await fetch(p); if (!r.ok) throw new Error(p); return r.json(); }
async function loadContent() {
  const kids = await loadJSON('../content/kids.json');
  const quran = await loadJSON('../content/quran.json');
  K.pack = kids;
  [...kids.items, ...quran.items].forEach(it => K.items.set(it.id, { ...it }));
  // Al-Ikhlas text and recitation, fetched once and kept on the phone.
  let data = await kv.get('quran-112');
  if (!data) {
    try {
      const j = await (await fetch('https://api.alquran.cloud/v1/surah/112/ar.alafasy')).json();
      data = j.data.ayahs.map(a => ({ ref: `112:${a.numberInSurah}`, text: a.text, audio: a.audio }));
      await kv.set('quran-112', data);
    } catch (e) { data = null; }
  }
  if (data) for (const a of data) { const it = [...K.items.values()].find(x => x.quran === a.ref); if (it) { it.ar = a.text; it.audio = a.audio; } }
}
async function loadState() {
  K.profile = await kv.get('profile') || null;
  K.units = await kv.get('units') || {};
  K.stickers = await kv.get('stickers') || [];
  K.progress = new Map((await db.all('progress')).map(p => [p.id, p]));
}
const saveProfile = () => kv.set('profile', K.profile);
const totalStars = () => Object.values(K.units).reduce((s, u) => s + (u.stars || 0), 0);
const unitItems = u => u.items.map(id => K.items.get(id)).filter(it => it && it.ar);
function unlockedIndex() { let i = 0; while (i < K.pack.units.length && K.units[K.pack.units[i].id]) i++; return Math.min(i, K.pack.units.length - 1); }

// ---------- first run ----------
function welcome() {
  render(`<main class="k-screen k-welcome">
    <div class="k-hero">${JAMAL}</div>
    <h1>${t('hello')}</h1><p class="k-lead">${t('intro')}</p>
    <button class="k-btn big" id="go">${t('go')}</button>
    <p class="k-small">${t('parents_note')}</p>
    <div class="k-lang"><button data-l="en" class="${lang === 'en' ? 'on' : ''}">English</button><button data-l="ur" class="${lang === 'ur' ? 'on' : ''}">اردو</button></div>
  </main>`);
  on('[data-l]', 'click', e => { setLang(e.currentTarget.dataset.l); welcome(); });
  on('#go', 'click', setup);
}

function setup() {
  let buddy = '🐪';
  render(`<main class="k-screen">
    <h1>${t('your_name')}</h1>
    <input id="name" class="k-input" maxlength="20" autocomplete="off" placeholder="${t('name_ph')}" aria-label="${t('name_ph')}">
    <h2>${t('pick_buddy')}</h2>
    <div class="k-buddies">${BUDDIES.map(b => `<button class="k-buddy ${b === buddy ? 'on' : ''}" data-b="${b}" aria-label="${b}">${b}</button>`).join('')}</div>
    <button class="k-btn big" id="start">${t('start')}</button>
  </main>`);
  on('[data-b]', 'click', e => { buddy = e.currentTarget.dataset.b; $app.querySelectorAll('.k-buddy').forEach(x => x.classList.toggle('on', x.dataset.b === buddy)); chime(true); });
  on('#start', 'click', async () => {
    K.profile = { name: $app.querySelector('#name').value.trim().slice(0, 20), buddy, lang, sounds: true, start: today(), created: new Date().toISOString() };
    await saveProfile(); await requestPersistence(); map();
  });
}

// ---------- the map ----------
function map() {
  setLang(K.profile.lang);
  const cur = unlockedIndex();
  const nodes = K.pack.units.map((u, i) => {
    const st = K.units[u.id];
    const state = st ? 'done' : i === cur ? 'current' : 'locked';
    const stars = st ? '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars) : '';
    return `<li class="k-node ${state} ${i % 2 ? 'right' : 'left'}">
      <button ${state === 'locked' ? 'disabled' : ''} data-u="${i}" aria-label="${esc(L(u.title))}${state === 'locked' ? ', ' + t('locked') : ''}">
        <span class="k-node-icon">${state === 'locked' ? '🔒' : esc(u.icon)}</span></button>
      <span class="k-node-label"><b>${esc(L(u.title))}</b>${stars ? `<span class="k-stars" aria-label="${st.stars}">${stars}</span>` : state === 'current' ? `<span class="k-play">${t('play')}</span>` : ''}</span></li>`;
  }).join('');
  render(`<main class="k-screen k-map">
    <header class="k-top">
      <span class="k-me"><span class="k-avatar">${esc(K.profile.buddy)}</span><b>${K.profile.name ? t('hi', { n: esc(K.profile.name) }) : t('hi_anon')}</b></span>
      <span class="k-score" aria-label="${totalStars()} ${t('stars')}">⭐ ${totalStars()}</span>
    </header>
    <button class="k-book" id="book"><span>📒</span><b>${t('stickers')}</b><small>${K.stickers.length}/${STICKERS.length}</small></button>
    <ol class="k-path">${nodes}</ol>
    <footer class="k-foot"><button class="k-gate" id="gate" aria-label="${t('parent_hold')}">⚙︎</button><small>${t('parent_hold')}</small><small>${t('version', { v: KIDS_VERSION })}</small></footer>
  </main>`);
  on('[data-u]', 'click', e => playUnit(Number(e.currentTarget.dataset.u)));
  on('#book', 'click', stickerBook);
  holdToOpen($app.querySelector('#gate'), parents);
  const curEl = $app.querySelector('.k-node.current'); if (curEl) setTimeout(() => curEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
}

function holdToOpen(el, fn) {
  let timer = null;
  const start = e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} el.classList.add('holding'); timer = setTimeout(() => { el.classList.remove('holding'); fn(); }, 2000); };
  const stop = () => { clearTimeout(timer); el.classList.remove('holding'); };
  el.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, stop));
}

// ---------- a level ----------
let LV = null;
function playUnit(ui) {
  const unit = K.pack.units[ui];
  const items = unitItems(unit);
  const date = today();
  const due = [...K.progress.values()].filter(p => p.due <= date && !unit.items.includes(p.id)).map(p => K.items.get(p.id)).filter(it => it && it.kind === 'pic').slice(0, 3);
  const words = items.filter(it => it.kind === 'pic');
  const steps = [];
  items.forEach(it => steps.push({ type: 'learn', it }));
  const isLetters = unit.id.startsWith('k-letters');
  shuffle([...words, ...due]).forEach(it => steps.push({ type: 'pic', it }));
  if (isLetters) shuffle(words).forEach(it => steps.push({ type: 'letter', it }));
  else sample(words, Math.min(4, words.length)).forEach(it => steps.push({ type: 'word', it }));
  if (canRecognize) sample(items, Math.min(3, items.length)).forEach(it => steps.push({ type: 'say', it }));
  LV = { ui, unit, steps, i: 0, first: new Map(), right: 0, total: 0 };
  step();
}

function frame(inner, { next = false } = {}) {
  const pct = Math.round(100 * LV.i / LV.steps.length);
  render(`<main class="k-screen k-level">
    <header class="k-ltop"><button class="k-x" id="quit" aria-label="${t('close')}">✕</button>
      <div class="k-meter"><i style="width:${pct}%"></i><span class="k-runner" style="inset-inline-start:calc(${pct}% - 18px)">${esc(K.profile.buddy)}</span></div></header>
    <section class="k-stage">${inner}</section>
    <div class="k-cheer" id="cheer" role="status"></div>
    ${next ? `<div class="k-dock"><button class="k-btn big" id="next">${t('next')}</button></div>` : ''}
  </main>`);
  on('#quit', 'click', map);
}
const nextStep = () => { LV.i++; step(); };

function step() {
  if (LV.i >= LV.steps.length) return finish();
  const s = LV.steps[LV.i];
  ({ learn: stepLearn, pic: stepPic, word: stepWord, letter: stepLetter, say: stepSay })[s.type](s.it);
}

function bigWord(it, cls = '') {
  if (it.kind === 'ayah') return `<div class="k-ayah ar" lang="ar">${esc(it.ar || '…')}</div>`;
  return `<div class="k-word ar ${cls}" lang="ar">${esc(it.ar)}</div>`;
}
function picHtml(it) {
  if (it.color) return `<span class="k-swatch" style="background:${it.color}"></span>`;
  if (it.num) return `<span class="k-num">${esc(it.pic)}<small>${'●'.repeat(it.num)}</small></span>`;
  return `<span class="k-emoji">${esc(it.pic || '📖')}</span>`;
}

async function record(it, ok) {
  if (LV.first.has(it.id)) return;
  LV.first.set(it.id, ok); LV.total++; if (ok) LV.right++;
  const base = K.progress.get(it.id);
  const p = base ? grade(base, ok, today(), null) : { ...newProgress(it.id, today()), right: ok ? 1 : 0, wrong: ok ? 0 : 1 };
  K.progress.set(it.id, p); await db.put('progress', p);
}
async function markSeen(it) {
  if (K.progress.has(it.id)) return;
  const p = newProgress(it.id, today()); K.progress.set(it.id, p); await db.put('progress', p);
}

function stepLearn(it) {
  frame(`<p class="k-q">${t('learn_this')}</p>
    <button class="k-card" id="hear" aria-label="${t('tap_to_hear')}">${it.kind === 'ayah' ? '<span class="k-emoji">📖</span>' : picHtml(it)}${bigWord(it)}
      <span class="k-tr">${esc(it.tr)}</span><span class="k-mean">${esc(mean(it))}</span><span class="k-hear">🔊 ${t('tap_to_hear')}</span></button>
    ${it.letter ? `<p class="k-letter-note"><span class="ar" lang="ar">${esc(it.letter)}</span></p>` : ''}`, { next: true });
  setTimeout(() => sayWord(it), 250);
  on('#hear', 'click', () => sayWord(it));
  on('#next', 'click', async () => { await markSeen(it); nextStep(); });
}

function choices(it, pool, renderOpt, promptHtml) {
  const others = sample(pool.filter(x => x.id !== it.id && renderOpt(x) !== renderOpt(it)), 2);
  const opts = shuffle([it, ...others]);
  frame(`${promptHtml}<div class="k-choices">${opts.map((o, k) => `<button class="k-choice" data-k="${k}">${renderOpt(o)}</button>`).join('')}</div>`);
  let solved = false;
  on('.k-choice', 'click', async e => {
    if (solved) return;
    const b = e.currentTarget, o = opts[Number(b.dataset.k)];
    if (o === it) {
      solved = true; b.classList.add('yes'); chime(true); await record(it, true);
      cheerUp(); setTimeout(nextStep, 900);
    } else {
      b.classList.add('no'); b.disabled = true; chime(false); await record(it, false);
      $app.querySelector('#cheer').textContent = t('try_again');
      setTimeout(() => b.classList.remove('no'), 500);
    }
  });
}
function cheerUp() {
  const c = $app.querySelector('#cheer'); c.textContent = cheer(); c.classList.add('pop');
  const burst = document.createElement('div'); burst.className = 'k-burst'; burst.innerHTML = '⭐'.repeat(5).split('').map((s, i) => `<i style="--a:${i * 72}deg">${s}</i>`).join('');
  $app.querySelector('.k-stage').appendChild(burst);
}
const picPool = () => [...K.items.values()].filter(x => x.kind === 'pic' && x.pic);

function stepPic(it) {
  choices(it, picPool(), o => picHtml(o), `<p class="k-q">${t('which_pic')}</p>
    <button class="k-sound" id="hear" aria-label="${t('tap_to_hear')}">🔊</button>${bigWord(it, 'small')}`);
  setTimeout(() => sayWord(it), 250);
  on('#hear', 'click', () => sayWord(it));
}
function stepWord(it) {
  choices(it, picPool(), o => `<span class="ar" lang="ar">${esc(o.ar)}</span>`, `<p class="k-q">${t('which_word')}</p><div class="k-bigpic">${picHtml(it)}</div>`);
}
function stepLetter(it) {
  const pool = picPool().filter(x => x.letter && x.letter !== it.letter);
  choices(it, pool, o => picHtml(o), `<p class="k-q">${t('which_letter')}</p><div class="k-letter ar" lang="ar">${esc(it.letter)}</div>`);
}
function stepSay(it) {
  frame(`<p class="k-q">${t('say_it')}</p>
    <div class="k-card still">${it.kind === 'ayah' ? '' : picHtml(it)}${bigWord(it)}<span class="k-tr">${esc(it.tr)}</span></div>
    <button class="k-mic" id="mic" aria-label="${t('say_hint')}">🎤</button><p class="k-small center">${t('say_hint')}</p>
    <button class="k-skip" id="skip">${t('skip')}</button>`);
  let tries = 0, done = false;
  const finishSay = ok => { if (done) return; done = true; setTimeout(nextStep, ok ? 900 : 300); };
  on('#mic', 'click', async () => {
    if (done) return;
    const m = $app.querySelector('#mic'); m.classList.add('live');
    try {
      const j = judge(await listen(), [it.ar, ...(it.accept || [])], it.kind === 'ayah' ? 0.45 : 0.5);
      tries++;
      if (j.pass) { chime(true); cheerUp(); await record(it, true); finishSay(true); }
      else { chime(false); $app.querySelector('#cheer').textContent = `${t('try_again')} ${t('heard', { h: j.heard })}`; if (tries >= 3) finishSay(false); }
    } catch (e) { $app.querySelector('#cheer').textContent = t('mic_fail'); }
    m.classList.remove('live');
  });
  on('#skip', 'click', () => finishSay(false));
}

async function finish() {
  const acc = LV.total ? LV.right / LV.total : 1;
  const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
  const prev = K.units[LV.unit.id];
  K.units[LV.unit.id] = { stars: Math.max(stars, prev?.stars || 0), played: (prev?.played || 0) + 1, last: today() };
  await kv.set('units', K.units);
  let sticker = null;
  const left = STICKERS.filter(s => !K.stickers.includes(s));
  if (left.length && (!prev || stars > (prev.stars || 0))) { sticker = pick(left); K.stickers.push(sticker); await kv.set('stickers', K.stickers); }
  chime(true);
  render(`<main class="k-screen k-done">
    <div class="k-confetti" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 6) * 0.15}s;--c:${['#FFC93C', '#FF5E7E', '#2BB3C0', '#1E9E6A'][i % 4]}"></i>`).join('')}</div>
    <div class="k-hero small">${JAMAL}</div>
    <h1>${t('level_done')}</h1>
    <p class="k-bigstars" aria-label="${t('you_got', { n: stars })}">${'<span class="on">★</span>'.repeat(stars)}${'<span>★</span>'.repeat(3 - stars)}</p>
    <p class="k-lead">${stars === 1 ? t('you_got_1') : t('you_got', { n: stars })}</p>
    ${sticker ? `<div class="k-sticker-new"><span>${sticker}</span><b>${t('new_sticker')}</b></div>` : ''}
    <div class="k-dock two"><button class="k-btn ghost" id="again">${t('play_again')}</button><button class="k-btn big" id="map">${t('back_map')}</button></div>
  </main>`);
  on('#map', 'click', map);
  on('#again', 'click', () => playUnit(LV.ui));
}

// ---------- sticker book ----------
function stickerBook() {
  render(`<main class="k-screen">
    <header class="k-ltop"><button class="k-x" id="back" aria-label="${t('close')}">✕</button><h1 class="k-title">${t('sticker_book')}</h1></header>
    <p class="k-lead center">${t('sticker_count', { n: K.stickers.length, t: STICKERS.length })}</p>
    <div class="k-grid">${STICKERS.map(s => K.stickers.includes(s) ? `<span class="k-st">${s}</span>` : `<span class="k-st locked">?</span>`).join('')}</div>
  </main>`);
  on('#back', 'click', map);
}

// ---------- parents ----------
function parents() {
  const p = K.profile;
  render(`<main class="k-screen k-parents">
    <header class="k-ltop"><button class="k-x" id="back" aria-label="${t('close')}">✕</button><h1 class="k-title">${t('parents')}</h1></header>
    <button class="k-btn grown" id="grown">${t('adult_app')}</button>
    <label class="k-row">${t('lang')}<select id="lang" class="k-input"><option value="en">English</option><option value="ur">اردو</option></select></label>
    <label class="k-row">${t('sounds')}<select id="snd" class="k-input"><option value="1">${t('on')}</option><option value="0">${t('off')}</option></select></label>
    <label class="k-row">${t('child_name')}<input id="name" class="k-input" maxlength="20" value="${esc(p.name)}"></label>
    <button class="k-btn" id="save">${t('save_btn')}</button>
    <hr>
    <button class="k-btn ghost" id="exp">${t('export')}</button>
    <label class="k-btn ghost">${t('import')}<input type="file" id="imp" accept="application/json,.json" hidden></label>
    <button class="k-btn danger" id="reset">${t('reset')}</button>
    <p class="k-small center">${t('version', { v: KIDS_VERSION })}</p>
  </main>`);
  $app.querySelector('#lang').value = p.lang; $app.querySelector('#snd').value = p.sounds === false ? '0' : '1';
  on('#back', 'click', map);
  on('#grown', 'click', () => { setMode('choose'); location.href = '../'; });
  on('#save', 'click', async () => {
    p.lang = $app.querySelector('#lang').value; p.sounds = $app.querySelector('#snd').value === '1'; p.name = $app.querySelector('#name').value.trim().slice(0, 20);
    await saveProfile(); setLang(p.lang); toast(t('saved')); map();
  });
  on('#exp', 'click', async () => {
    const data = await exportData(); data.units = K.units; data.stickers = K.stickers;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = `kn-arabic-kids-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); toast(t('saved'));
  });
  on('#imp', 'change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); await importData(d); if (d.units) await kv.set('units', d.units); if (d.stickers) await kv.set('stickers', d.stickers); await loadState(); toast(t('imported')); map(); }
    catch (err) { toast(t('import_fail')); }
  });
  on('#reset', 'click', async () => {
    if (!confirm(t('reset_confirm'))) return;
    await db.clear('progress'); await db.clear('log'); await kv.set('profile', null); await kv.set('units', {}); await kv.set('stickers', []);
    await loadState(); welcome();
  });
}

// ---------- start ----------
async function boot() {
  setMode('kids');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: '../', updateViaCache: 'none' }).catch(() => {});
  await loadState();
  setLang(K.profile?.lang || ((navigator.language || '').startsWith('ur') ? 'ur' : 'en'));
  try { await loadContent(); } catch (e) { render(`<main class="k-screen"><p class="k-lead">Could not load the lessons. Check the internet and reload.</p></main>`); return; }
  if (!K.profile) welcome(); else map();
}
window.__kids = { K, map, playUnit };
boot();

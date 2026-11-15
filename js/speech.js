// Text-to-speech, speech recognition, recording and Gemini pronunciation feedback.

// ---------- Arabic text helpers ----------
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export function normalizeArabic(s) {
  return (s || '')
    .replace(DIACRITICS, '')
    .replace(/[آأإٱ]/g, 'ا') // alef forms -> bare alef
    .replace(/ة/g, 'ه')                      // taa marbuta -> haa
    .replace(/ى/g, 'ي')                      // alef maqsura -> yaa
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function similarity(heard, target) {
  const a = normalizeArabic(heard).replace(/\s/g, ''), b = normalizeArabic(target).replace(/\s/g, '');
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// ---------- Text-to-speech ----------
let arVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  arVoice = voices.find(v => /^ar[-_]SA/i.test(v.lang)) || voices.find(v => /^ar/i.test(v.lang)) || null;
  return arVoice;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

export function hasArabicVoice() { return !!(arVoice || pickVoice()); }

export function speak(text, rate = 0.8) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve(false);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    if (arVoice || pickVoice()) u.voice = arVoice;
    u.rate = rate;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}

let audioEl = null;
export function playUrl(url) {
  return new Promise(resolve => {
    if (audioEl) audioEl.pause();
    audioEl = new Audio(url);
    audioEl.onended = () => resolve(true);
    audioEl.onerror = () => resolve(false);
    audioEl.play().catch(() => resolve(false));
  });
}

// ---------- Speech recognition ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canRecognize = !!SR;

// Resolves with an array of transcripts (best first), or rejects with an error code.
export function listen({ timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('unsupported'));
    const r = new SR();
    r.lang = 'ar-SA';
    r.interimResults = false;
    r.maxAlternatives = 5;
    r.continuous = false;
    let done = false;
    const finish = (fn, v) => { if (!done) { done = true; clearTimeout(t); try { r.stop(); } catch (e) {} fn(v); } };
    const t = setTimeout(() => finish(reject, new Error('timeout')), timeoutMs);
    r.onresult = e => {
      const alts = [];
      for (const res of e.results) for (const alt of res) alts.push(alt.transcript);
      finish(resolve, alts);
    };
    r.onerror = e => finish(reject, new Error(e.error || 'error'));
    r.onend = () => finish(reject, new Error('no-speech'));
    try { r.start(); } catch (e) { finish(reject, e); }
  });
}

// Best match among alternatives against any accepted target.
export function judge(alts, targets, threshold = 0.6) {
  let best = { score: 0, heard: alts[0] || '' };
  const raw = s => (s || '').replace(/\s/g, '');
  for (const a of alts) for (const t of targets) {
    if (raw(a) && raw(a) === raw(t)) return { score: 1, heard: a, pass: true }; // e.g. digits "3" / "٣"
    const s = similarity(a, t);
    if (s > best.score) best = { score: s, heard: a };
  }
  return { ...best, pass: best.score >= threshold };
}

// ---------- Recording (for Gemini feedback) ----------
export async function record(ms = 4000) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const stopped = new Promise(res => { rec.onstop = res; });
  rec.start();
  await new Promise(r => setTimeout(r, ms));
  rec.stop();
  await stopped;
  stream.getTracks().forEach(t => t.stop());
  return new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
}

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1]);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

// ---------- Gemini feedback ----------
export async function geminiFeedback({ key, model, blob, item, uiLang }) {
  const data = await blobToBase64(blob);
  const lang = uiLang === 'ur' ? 'Urdu' : 'English';
  const prompt = `You are a kind Arabic pronunciation coach for a beginner whose first language is Urdu or English.
The learner tried to say: ${item.ar}  (transliteration: ${item.tr}; meaning: ${item.en}).
Listen to the recording. Reply in ${lang}, in at most 3 short bullet points:
1) an overall score from 1 to 5,
2) the one or two sounds to fix (name the Arabic letter, e.g. ع ح ق ص ض ط ظ خ غ, and say how to make it),
3) one encouraging tip. If the audio is silent or unclear, say so in one line.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: blob.type.split(';')[0] || 'audio/webm', data } }] }] }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Gemini ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const json = await resp.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('\n').trim() || '—';
}

// Arabic as it is usually printed: no vowel marks.
export function stripMarks(s) { return (s || '').replace(DIACRITICS, ''); }

// ---------- Gemini role-play conversation (text in, JSON out) ----------
export async function geminiChat({ key, model, system, history }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Gemini ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const json = await resp.json();
  const text = (json?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  try { return JSON.parse(text); } catch (e) { return { ar: text, tr: '', en: '', ur: '' }; }
}

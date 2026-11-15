// Profiles: any number of grown-ups and children on one phone. Each profile has its own database,
// so learning histories never mix. The list lives in localStorage; the active profile is chosen
// before the app loads (see the small script in each index.html).
const REG = 'kn-profiles', ACTIVE = 'kn-active', MODE = 'kn-mode';
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

export const BUDDIES = ['🐪', '🦁', '🐱', '🦊', '🐼', '🐢'];
export const ADULT_ICONS = ['🌿', '🌙', '⭐', '📖', '🕌', '🌴'];

export function listProfiles() { try { return JSON.parse(ls.get(REG) || '[]'); } catch (e) { return []; } }
export function saveProfiles(list) { ls.set(REG, JSON.stringify(list)); }
export function activeProfile() { const id = ls.get(ACTIVE); return listProfiles().find(p => p.id === id) || null; }
export function setMode(m) { ls.set(MODE, m); }
export function getMode() { return ls.get(MODE); }
export function updateProfile(id, patch) { const l = listProfiles(); const p = l.find(x => x.id === id); if (p) { Object.assign(p, patch); saveProfiles(l); } return p; }

async function existingDbs() {
  try { return indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : null; } catch (e) { return null; }
}

function openExisting(name) {
  return new Promise((res) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
}
async function readAll(name, keys) {
  const names = await existingDbs();
  if (names && !names.includes(name)) return null;
  const db = await openExisting(name);
  if (!db) return null;
  if (!db.objectStoreNames.contains('kv')) { db.close(); return null; }
  const get = (store, k) => new Promise(res => { try { const q = k === undefined ? db.transaction(store).objectStore(store).getAll() : db.transaction(store).objectStore(store).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } });
  const out = {};
  for (const [label, store, k] of keys) out[label] = await get(store, k);
  db.close();
  return out;
}

// Bring older installs (one grown-up, one child) into the profile list once.
export async function migrateProfiles() {
  const list = listProfiles();
  if (list.length || ls.get('kn-migrated')) return list;
  ls.set('kn-migrated', '1');
  // Only databases that already hold a learner's profile count; an empty one is ignored.
  const adult = await readAll('kn-arabic', [['profile', 'kv', 'profile']]);
  if (adult?.profile) list.push({ id: 'adult-1', type: 'adult', name: '', icon: '🌿', db: 'kn-arabic', created: Date.now() });
  const kid = await readAll('kn-arabic-kids', [['profile', 'kv', 'profile']]);
  if (kid?.profile) list.push({ id: 'kid-1', type: 'kid', name: kid.profile.name || '', icon: kid.profile.buddy || '🐪', db: 'kn-arabic-kids', created: Date.now() });
  saveProfiles(list);
  const mode = getMode();
  const pick = list.find(p => p.type === (mode === 'kids' ? 'kid' : 'adult'));
  if (pick) ls.set(ACTIVE, pick.id);
  return list;
}

export function createProfile(type, name, icon) {
  const list = listProfiles();
  const base = type === 'kid' ? 'kn-arabic-kids' : 'kn-arabic';
  const id = `${type}-${Date.now().toString(36)}`;
  const db = list.some(p => p.db === base) ? `${base}-${id}` : base;
  const p = { id, type, name: name.trim().slice(0, 24), icon: icon || (type === 'kid' ? '🐪' : '🌿'), db, created: Date.now() };
  list.push(p); saveProfiles(list);
  return p;
}

export async function deleteProfile(id) {
  const list = listProfiles(); const p = list.find(x => x.id === id); if (!p) return;
  saveProfiles(list.filter(x => x.id !== id));
  if (ls.get(ACTIVE) === id) ls.set(ACTIVE, '');
  await new Promise(res => { const r = indexedDB.deleteDatabase(p.db); r.onsuccess = r.onerror = r.onblocked = () => res(); });
}

// Open a profile: remember it, then load its app. `root` is the path to the site root from the current page.
export function openProfile(p, root = './') {
  ls.set(ACTIVE, p.id);
  setMode(p.type === 'kid' ? 'kids' : 'adult');
  location.href = root + (p.type === 'kid' ? 'kids/' : '');
}
export function chooseProfile(root = './') { setMode('choose'); location.href = root; }

// A short summary for the profile picker, read without creating anything.
export async function profileSummary(p) {
  if (p.type === 'kid') {
    const d = await readAll(p.db, [['profile', 'kv', 'profile'], ['units', 'kv', 'units']]);
    if (!d || !d.profile) return { fresh: true };
    return { stars: Object.values(d.units || {}).reduce((a, u) => a + (u.stars || 0), 0), levels: Object.keys(d.units || {}).length };
  }
  const d = await readAll(p.db, [['profile', 'kv', 'profile'], ['log', 'log', undefined], ['progress', 'progress', undefined]]);
  if (!d || !d.profile) return { fresh: true };
  const dates = new Set((d.log || []).map(l => l.date));
  const z = n => String(n).padStart(2, '0');
  const iso = dt => `${dt.getFullYear()}-${z(dt.getMonth() + 1)}-${z(dt.getDate())}`;
  let streak = 0; const day = new Date();
  if (!dates.has(iso(day))) day.setDate(day.getDate() - 1);
  while (dates.has(iso(day))) { streak++; day.setDate(day.getDate() - 1); }
  const start = d.profile.start ? new Date(d.profile.start + 'T12:00:00') : new Date();
  return { day: Math.round((Date.now() - start.getTime()) / 864e5) + 1, streak, words: (d.progress || []).length };
}

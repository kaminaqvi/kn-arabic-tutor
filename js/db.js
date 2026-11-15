// Tiny IndexedDB wrapper. Stores: progress (per item), log (per day), kv (profile, settings, caches).
const DB_NAME = 'kn-arabic';
const DB_VERSION = 1;
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('log')) db.createObjectStore('log', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(store, mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    Promise.resolve(fn(s)).then(v => { out = v; });
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

const wrap = req => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export const db = {
  get: (store, key) => tx(store, 'readonly', s => wrap(s.get(key))),
  all: (store) => tx(store, 'readonly', s => wrap(s.getAll())),
  put: (store, value, key) => tx(store, 'readwrite', s => wrap(key === undefined ? s.put(value) : s.put(value, key))),
  del: (store, key) => tx(store, 'readwrite', s => wrap(s.delete(key))),
  clear: (store) => tx(store, 'readwrite', s => wrap(s.clear())),
  putMany: (store, values) => tx(store, 'readwrite', s => { values.forEach(v => s.put(v)); }),
};

export const kv = {
  get: k => db.get('kv', k),
  set: (k, v) => db.put('kv', v, k),
};

export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      return already || await navigator.storage.persist();
    }
  } catch (e) { /* ignore */ }
  return false;
}

export const SCHEMA_VERSION = 1;

// Backup excludes settings (which hold the Gemini key).
export async function exportData() {
  const [profile, progress, log] = await Promise.all([kv.get('profile'), db.all('progress'), db.all('log')]);
  return { app: 'kn-arabic-tutor', schema: SCHEMA_VERSION, exported: new Date().toISOString(), profile, progress, log };
}

export async function importData(data) {
  if (!data || data.app !== 'kn-arabic-tutor' || !Array.isArray(data.progress)) throw new Error('bad-file');
  await kv.set('autobackup', await exportData());
  await db.clear('progress');
  await db.clear('log');
  await db.putMany('progress', data.progress);
  await db.putMany('log', data.log || []);
  if (data.profile) await kv.set('profile', data.profile);
}

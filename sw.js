// Service worker.
// App files: network first (so a new release shows up on the next open), cache as the offline fallback.
// Qur'an text/audio and fonts: cache first after the first download.
const VERSION = 'kn-v3.4.0';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'version.json',
  'js/app.js', 'js/db.js', 'js/srs.js', 'js/speech.js', 'js/i18n.js',
  'content/index.json', 'content/foundations.json', 'content/umrah.json', 'content/shared.json', 'content/roleplays.json', 'content/quran.json', 'content/reading.json', 'content/conversation.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'kids/', 'kids/index.html', 'kids/manifest.webmanifest', 'js/kids.js', 'css/kids.css', 'content/kids.json', 'icons/kids-192.png', 'icons/kids-512.png',
];
const RUNTIME = ['api.alquran.cloud', 'cdn.islamic.network', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new release never precaches old files.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return; // audio streams: let the browser handle them
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const fresh = await fetch(req, { cache: 'no-cache' });
        if (fresh.ok && !url.pathname.endsWith('/version.json')) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
      }
    })());
    return;
  }
  if (!RUNTIME.includes(url.hostname)) return; // e.g. Gemini: always network
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(req);
    if (cached) return cached;
    const resp = await fetch(req);
    if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone());
    return resp;
  }));
});

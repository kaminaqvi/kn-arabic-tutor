// Service worker: app shell and lessons work offline; Qur'an text/audio and fonts are cached after first use.
const VERSION = 'kn-v2.0.0';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/db.js', 'js/srs.js', 'js/speech.js', 'js/i18n.js',
  'content/index.json', 'content/foundations.json', 'content/umrah.json', 'content/shared.json', 'content/roleplays.json', 'content/quran.json', 'content/reading.json', 'content/conversation.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];
const RUNTIME = ['api.alquran.cloud', 'cdn.islamic.network', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || e.request.headers.has('range')) return; // audio streams: let the browser handle them
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !RUNTIME.includes(url.hostname)) return; // e.g. Gemini: always network
  // Stale-while-revalidate: answer from cache at once, refresh in the background.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: sameOrigin });
    const network = fetch(e.request).then(resp => {
      if (resp && (resp.ok || resp.type === 'opaque')) cache.put(e.request, resp.clone());
      return resp;
    }).catch(() => cached);
    return cached || network;
  }));
});

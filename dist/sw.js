const CACHE = 'cornerwork-v284';
const CORE = [
  './',
  './index.html',
  './assets/css/app.css',
  './assets/css/features.css',
  './assets/icons/ui-icons.svg',
  './assets/icons/Header-icon.webp',
  './favicon.ico',
  './favicon-v2.png',
  './apple-touch-icon-v2.png',
  './assets/js/app.js',
  './assets/js/bootstrap.js',
  './assets/js/enhancements.js',
  './assets/js/endless.js',
  './assets/js/icon-themes.js',
  './assets/js/voice-engine.js',
  './assets/voices/manifest.json',
  './assets/voices/bella.opus',
  './assets/voices/michael.opus',
  './assets/icons/catalog.json',
  './assets/fonts/league-spartan-clock.woff',
  './manifest.webmanifest',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];
self.addEventListener('install', (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await cache.addAll(CORE);
      })
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) =>
        clients.forEach((client) =>
          client.postMessage({ type: 'CORNERWORK_UPDATE', version: CACHE }),
        ),
      ),
  ),
);
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url),
    sameOrigin = url.origin === location.origin,
    networkFirst =
      sameOrigin &&
      (event.request.mode === 'navigate' ||
        event.request.destination === 'script' ||
        event.request.destination === 'style' ||
        url.pathname.endsWith('/assets/icons/catalog.json')),
    cacheable =
      sameOrigin ||
      [
        'www.gstatic.com',
        'cdn.jsdelivr.net',
        'accounts.google.com',
        'storage.googleapis.com',
      ].includes(url.hostname);
  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./index.html')),
        ),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (cacheable && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }),
    ),
  );
});

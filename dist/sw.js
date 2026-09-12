const CACHE = 'cornerwork-v191';
const CORE = [
  './',
  './index.html',
  './assets/css/app.css',
  './assets/css/features.css',
  './assets/icons/ui-icons.svg',
  './assets/js/app.js',
  './assets/js/bootstrap.js',
  './assets/js/enhancements.js',
  './assets/js/icon-themes.js',
  './assets/icons/catalog.json',
  './assets/fonts/league-spartan-clock.woff',
  './assets/fonts/montserrat-clock.woff',
  './assets/fonts/barlow-condensed-clock.woff',
  './assets/fonts/allerta-stencil-clock.ttf',
  './assets/fonts/keania-one-clock.ttf',
  './manifest.webmanifest',
  './assets/icons/icon.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];
const ICON_FILES = ['icon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

async function cacheIconThemes(cache) {
  const response = await fetch('./assets/icons/catalog.json');
  if (!response.ok) return;
  const catalogue = await response.json();
  const iconAssets = catalogue.themes.flatMap(({ id }) => {
    const root = id === 'default' ? './assets/icons' : `./assets/icons/${encodeURIComponent(id)}`;
    const manifest =
      id === 'default'
        ? './manifest.webmanifest'
        : `./manifest-${encodeURIComponent(id)}.webmanifest`;
    return [manifest, ...ICON_FILES.map((filename) => `${root}/${filename}`)];
  });
  await cache.addAll(iconAssets);
}

self.addEventListener('install', (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await cache.addAll(CORE);
        await cacheIconThemes(cache);
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
      ['www.gstatic.com', 'cdn.jsdelivr.net', 'accounts.google.com'].includes(url.hostname);
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

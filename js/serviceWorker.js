const CACHE_NAME = 'winery-game-cache-v4';
const urlsToCache = [
  '/assets/pic/bottles_dalle.webp',
  '/assets/pic/crushing_dalle.webp',
  '/assets/pic/farming_dalle.webp',
  '/assets/pic/fermentation_dalle.webp',
  '/assets/pic/grapes_dalle.webp',
  '/assets/pic/must_dalle.webp',
  '/assets/pic/sales_dalle.webp',
  '/assets/pic/staff_dalle.webp',
  '/assets/pic/vineyard_dalle.webp',
  '/assets/pic/warehouse_dalle.webp',
  '/assets/pic/winecellar_dalle.webp',
  '/assets/pic/winery_dalle.webp',
  '/assets/bg/bg_panel.webp',
  '/assets/bg/bg_winery.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Skip cache in development environment
  if (event.request.url.includes('.replit.dev')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
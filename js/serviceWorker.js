const CACHE_NAME = 'winery-game-cache-v2';
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
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Add a message event listener to handle cache clearing
self.addEventListener('message', event => {
  if (event.data === 'clearCache') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    });
  }
});
const CACHE_NAME = 'wine-game-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.delete(CACHE_NAME)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

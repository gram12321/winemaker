
const CACHE_NAME = 'winery-game-cache-v1';
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
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

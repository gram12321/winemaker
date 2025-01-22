
const CACHE_NAME = 'winery-game-cache-v3';
const urlsToCache = [
  'assets/pic/bottles_dalle.webp',
  'assets/pic/crushing_dalle.webp',
  'assets/pic/farming_dalle.webp',
  'assets/pic/fermentation_dalle.webp',
  'assets/pic/grapes_dalle.webp',
  'assets/pic/must_dalle.webp',
  'assets/pic/sales_dalle.webp',
  'assets/pic/staff_dalle.webp',
  'assets/pic/vineyard_dalle.webp',
  'assets/pic/warehouse_dalle.webp',
  'assets/pic/winecellar_dalle.webp',
  'assets/pic/winery_dalle.webp',
  'assets/bg/bg_panel.webp',
  'assets/bg/bg_winery.webp',
  'js/overlays/resourceInfoOverlay.js'
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
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request.url)
          .then(response => {
            if (!response || response.status === 404) {
              if (event.request.url.includes('resourceInfoOverlay.js')) {
                return new Response('', {
                  status: 200,
                  headers: new Headers({
                    'Content-Type': 'application/javascript'
                  })
                });
              }
            }
            return response;
          })
          .catch(() => {
            return new Response('', {
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/javascript'
              })
            });
          });
      })
  );
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
});

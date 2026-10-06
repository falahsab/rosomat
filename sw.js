/* ===================================================
   Rosomat PWA Service Worker (sw.js)
   Provides offline caching, instant load, and PWA capabilities
=================================================== */

const CACHE_NAME = 'rosomat-pwa-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './store.html',
  './blog.html',
  './style.css',
  './blog.css',
  './manifest.json',
  './images/favicon.png',
  './images/icons/icon-192.png',
  './images/icons/icon-512.png',
  './images/icons/apple-touch-icon.png'
];

// Install: Cache critical core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('PWA: Some core assets could not be cached initially:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate for static assets, Network-First for HTML
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // If requesting HTML page or navigation
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Static assets: Cache-first, then update in background
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) {
        fetch(req).then((netRes) => {
          if (netRes && netRes.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, netRes));
          }
        }).catch(() => {});
        return cachedRes;
      }

      return fetch(req).then((netRes) => {
        if (netRes && netRes.ok && (url.origin === location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('cdn.jsdelivr.net'))) {
          const clone = netRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return netRes;
      }).catch(() => {
        // Fallback for missing images
        if (req.destination === 'image') {
          return caches.match('./images/favicon.png');
        }
      });
    })
  );
});

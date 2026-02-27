const CACHE_NAME = 'my-unfolding-v3';
const APP_SHELL = [
  '/',
  '/index.html'
];

// Install — cache app shell, activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clear old caches, take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
  // Notify all clients that a new version is active
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
  });
});

// Fetch — network-first for everything, fall back to cache for offline
self.addEventListener('fetch', (event) => {
  // Never cache API calls
  if (event.request.url.includes('/api/')) return;
  
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the cached index.html (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

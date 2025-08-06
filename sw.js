// sw.js

const CACHE_NAME = 'megamail-v1.4';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png'
];

// URLs for runtime caching using a stale-while-revalidate strategy
const RUNTIME_CACHE_HOSTS = [
  'https://app.megamail.ir',
  'https://api.elasticemail.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://esm.sh' // For React and other dependencies from esm.sh
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_URLS);
    }).catch(err => {
      console.error('Service Worker: Failed to cache app shell:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If the request is for an API or external resource, use a stale-while-revalidate strategy.
  if (RUNTIME_CACHE_HOSTS.some(host => url.origin.startsWith(host))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Check if we received a valid response
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.warn('Service Worker: Fetch failed, falling back to cache if available.', err);
            // If fetch fails and we have a cached response, the cachedResponse will be used.
            // If not, the error will propagate.
          });

          // Return cached response immediately if available, and update cache in background.
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For app shell requests, use Cache-First.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If we have a response in cache, return it.
      // Otherwise, fetch from the network.
      return response || fetch(event.request);
    })
  );
});

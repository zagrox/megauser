// sw.js

const CACHE_NAME = 'megamail-v1.5';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/src/index.css',
  '/manifest.json'
];

// URLs for runtime caching using a stale-while-revalidate strategy
const RUNTIME_CACHE_HOSTS = [
  'https://accounting.mailzila.com',
  'https://api.elasticemail.com',
  'https://dns.google',
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
  if (RUNTIME_CACHE_HOSTS.some(host => url.hostname.endsWith(host) || url.hostname.startsWith(host))) {
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
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For app shell requests, use Cache-First.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
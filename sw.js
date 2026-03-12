const CACHE_NAME = 'shiftmaster-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// --- PWABuilder Compatibility Stubs ---

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic background sync event:', event.tag);
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Shift Master';
  const options = {
    body: data.body || 'New update available',
    icon: '/https://picsum.photos/seed/shiftmaster/192/192',
    badge: '/https://picsum.photos/seed/shiftmaster/192/192'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Service Worker — сбрасывает кэш при каждом обновлении
const CACHE_VERSION = 'v6110f99';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Не кэшируем ничего — всегда свежий контент
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

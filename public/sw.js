const CACHE_NAME = 'bananet-v1';
const STATIC_CACHE = 'bananet-static-v1';

// Ресурсы для предварительного кэширования
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API и внешние запросы — только сеть
  if (
    url.hostname !== self.location.hostname ||
    request.url.includes('functions.poehali.dev') ||
    request.url.includes('mc.yandex.ru') ||
    request.method !== 'GET'
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML навигация — network first, fallback на кэш
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }

  // JS/CSS/шрифты — cache first, обновляем в фоне
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});

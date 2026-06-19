var CACHE_NAME = 'vyvy-v3';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/content.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // API calls: network only
  if (url.pathname === '/chat' || url.pathname === '/health') {
    e.respondWith(
      fetch(e.request).catch(function () {
        return new Response(
          JSON.stringify({ reply: 'VyVy đang ngoại tuyến. Thử lại sau nhé!' }),
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // Static: network first for HTML/CSS/JS, cache first for others
  var isDoc = url.pathname === '/' || url.pathname.endsWith('.html') ||
              url.pathname.endsWith('.css') || url.pathname.endsWith('.js');
  if (isDoc) {
    e.respondWith(
      fetch(e.request).then(function (resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function () {
        return caches.match(e.request);
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        return cached || fetch(e.request);
      })
    );
  }
});

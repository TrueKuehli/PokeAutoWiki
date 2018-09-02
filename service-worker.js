let CACHE = 'cache-and-update';

self.addEventListener('install', (e) => {
  console.log('Installing Service Worker.');
  e.waitUntil(precache());
});

self.addEventListener('fetch', (e) => {
  console.log('Serving assets from Service Worker.');
  e.respondWith(fromCache(e.request));
  e.waitUntil(update(e.request));
});

function precache() {
  return caches.open(CACHE).then((cache) => {
    return cache.addAll([
      './index.html',
      './index.js',
      './manifest.webmanifest',
      './styles/index.css',
      './ressources/'
    ]);
  });
}

function fromCache(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.match(request).then((matching) => {
      return matching || fetch(request).then((response) => {
        cache.put(request, response.clone());
        return response;
      });
    });
  });
}

function update(request) {
  return caches.open(CACHE).then((cache) => {
    return fetch(request).then((response) => {
      return cache.put(request, response);
    });
  });
}

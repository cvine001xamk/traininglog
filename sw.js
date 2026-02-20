const CACHE_NAME = "training-log-cache-v16";
const urlsToCache = [
  "./",
  "./index.html",
  "./app.js",
  "./history.js",
  "./exercises.js",
  "./utils.js",
  "./manifest.json",
  "./style.css",
  "./dexie.min.js",
  "./chart.min.js",
  "./favicon.ico",
  "./static/fonts/Bokor-Regular.ttf",
  "./static/logos/logo.png",
  "./static/logos/logo192.png",
  "./static/logos/logo512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

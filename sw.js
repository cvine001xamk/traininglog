const CACHE_NAME = "training-log-cache-v36";
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
  "./static/go.wav",
  "./static/ten.wav",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Background revalidation: update cache
          if (
            networkResponse &&
            (networkResponse.status === 200 ||
              networkResponse.type === "opaque")
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return null;
        });

      return (
        cachedResponse ||
        fetchPromise.then(
          (response) =>
            response ||
            cachedResponse ||
            new Response("Service Unavailable", {
              status: 503,
              statusText: "Service Unavailable",
            }),
        )
      );
    }),
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
          }),
        );
      }),
      self.clients.claim(),
    ]),
  );
});

// Background Rest Timer Notifications
let activeTimerTimeout = null;

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SCHEDULE_TIMER") {
    if (activeTimerTimeout) {
      clearTimeout(activeTimerTimeout);
      activeTimerTimeout = null;
    }

    const delayMs = Math.max(0, event.data.targetEndTime - Date.now());

    activeTimerTimeout = setTimeout(() => {
      activeTimerTimeout = null;
      self.registration.showNotification("Rest Timer Finished! ⏱️", {
        body: "Rest time is up! Ready for your next set 💪",
        icon: "static/logos/logo192.png",
        badge: "static/logos/logo192.png",
        tag: "rest-timer-notification",
        renotify: true,
        data: { url: "./index.html" },
      });
    }, delayMs);
  } else if (event.data.type === "CANCEL_TIMER") {
    if (activeTimerTimeout) {
      clearTimeout(activeTimerTimeout);
      activeTimerTimeout = null;
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("./index.html");
      }
    }),
  );
});


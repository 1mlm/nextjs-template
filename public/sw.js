// only job: when a page can't load because there's no network, show the
// offline page instead of the browser's dino. data is never cached, stale
// data would be worse than no page
const OFFLINE_CACHE = "offline-v1";
const OFFLINE_ASSETS = ["/offline.html", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html")),
    );
    return;
  }
  if (new URL(request.url).pathname === "/icon.svg")
    event.respondWith(fetch(request).catch(() => caches.match("/icon.svg")));
});

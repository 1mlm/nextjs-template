// two jobs. when a page can't load because there's no network, show the
// offline page instead of the browser's dino (data is never cached, stale
// data would be worse than no page). and in production, keep the hashed build
// files (js, css, fonts) and sounds, they never change under the same url, so
// repeat visits skip the network for them and the offline page's icon is
// always there. registered with ?static=1 in production only, dev files
// change under the same url
const OFFLINE_CACHE = "offline-v1";
const OFFLINE_ASSETS = ["/offline.html", "/icon.svg"];
const STATIC_CACHE = "static-v1";
const MAX_STATIC_ENTRIES = 200;
const shouldCacheStatic = new URL(self.location).searchParams.has("static");

const isStaticAsset = ({ pathname }) =>
  pathname.startsWith("/_next/static/") ||
  pathname.startsWith("/sfx/") ||
  pathname.startsWith("/svgs/");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keepCaches = [OFFLINE_CACHE, STATIC_CACHE];
  event.waitUntil(
    Promise.all([
      // starts the page request while the worker boots instead of after
      self.registration.navigationPreload?.enable(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => !keepCaches.includes(key))
              .map((key) => caches.delete(key)),
          ),
        ),
    ]).then(() => self.clients.claim()),
  );
});

// oldest first, a cache keeps its entries in insertion order
async function trimStaticCache(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys
      .slice(0, keys.length - MAX_STATIC_ENTRIES)
      .map((key) => cache.delete(key)),
  );
}

async function respondWithStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await trimStaticCache(cache);
  }
  return response;
}

async function respondWithPageOrOffline(event) {
  try {
    return (await event.preloadResponse) ?? (await fetch(event.request));
  } catch {
    return caches.match("/offline.html");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(respondWithPageOrOffline(event));
    return;
  }
  const url = new URL(request.url);
  if (url.pathname === "/icon.svg") {
    event.respondWith(fetch(request).catch(() => caches.match("/icon.svg")));
    return;
  }
  const isSameOriginGet =
    request.method === "GET" && url.origin === self.location.origin;
  if (shouldCacheStatic && isSameOriginGet && isStaticAsset(url))
    event.respondWith(respondWithStaticAsset(request));
});

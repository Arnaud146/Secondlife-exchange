const CACHE_VERSION = "secondlife-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = ["/offline", "/icons/icon-192.svg", "/icons/icon-512.svg"];

// Paths that should never be cached by the service worker
const NO_CACHE_PATHS = ["/_next/", "/api/", "/auth/"];

function shouldCache(url) {
  const path = new URL(url).pathname;
  return !NO_CACHE_PATHS.some((prefix) => path.startsWith(prefix));
}

function isSuccessResponse(response) {
  return response && response.status === 200 && response.type !== "opaque";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        // Use individual put() calls so one failure doesn't break the whole install
        Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            fetch(url)
              .then((response) => {
                if (isSuccessResponse(response)) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {
                /* skip URLs that fail to fetch */
              }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Only handle same-origin requests
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Skip paths that should not be cached
  if (!shouldCache(event.request.url)) {
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isSuccessResponse(response)) {
            const responseClone = response.clone();
            void caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          const offlineResponse = await caches.match("/offline");
          if (offlineResponse) {
            return offlineResponse;
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" },
          });
        }),
    );
    return;
  }

  // Sub-resources: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (isSuccessResponse(response)) {
            const responseClone = response.clone();
            void caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return new Response("", { status: 408, statusText: "Offline" });
        });
    }),
  );
});

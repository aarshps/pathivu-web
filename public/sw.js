// Minimal offline app-shell service worker. Firestore's own IndexedDB cache
// handles data offline; this just keeps the shell loadable with no network.
const CACHE = "pathivu-shell-v1";
const SHELL = ["/", "/stats", "/settings", "/manifest.webmanifest", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never intercept Firebase / Google traffic — let the SDK manage it.
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations (fresh app), cache fallback when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Cache-first for same-origin static assets.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req)),
  );
});

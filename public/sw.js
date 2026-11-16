/*
 * H&H service worker — makes the site installable as an app and lets it open
 * quickly, and show a page even with a weak connection.
 *
 * - Pages (the app shell): network first, so a new Publish is picked up on the
 *   next open; the saved copy is only used when the network is down.
 * - Built files (/assets/…, hashed names) and icons: cache first — a new
 *   Publish gives them new names, so a saved copy is never out of date.
 * - Anything on another site (the Neon database and sign-in) is never touched:
 *   orders and accounts always come live from the server.
 *
 * Change VERSION to throw every saved copy away.
 */
const VERSION = "hh-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

const scope = new URL(self.registration.scope);
const INDEX = new URL("./", scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([INDEX]))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put(INDEX, copy));
          }
          return response;
        })
        .catch(() => caches.match(INDEX).then((cached) => cached || Response.error())),
    );
    return;
  }

  const fixed = url.pathname.includes("/assets/") || url.pathname.includes("/icons/");
  if (!fixed) return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ASSETS).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

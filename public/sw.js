const CACHE_VERSION = "v1";
const APP_CACHE = `sd-viewer-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sd-viewer-runtime-${CACHE_VERSION}`;

// Vite emits hashed JS/CSS bundles whose names we can't know ahead of time, so
// the pre-cache only covers stable entry points; hashed assets are cached at
// runtime by the stale-while-revalidate fetch handler below.
const APP_SHELL = [
  "./",
  "index.html",
  "chapters.json",
  "manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(APP_SHELL);

      try {
        const res = await fetch("chapters.json");
        const chapters = await res.json();
        const mdUrls = chapters.map((ch) => `beginner/${ch.slug}.md`);
        await cache.addAll(mdUrls);
      } catch (err) {
        // Offline install or chapters.json unavailable — app shell is still cached.
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== APP_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  event.respondWith(
    (async () => {
      const cache = await caches.open(isSameOrigin ? APP_CACHE : RUNTIME_CACHE);
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      if (cached) {
        // Stale-while-revalidate: serve cached copy, refresh in background.
        networkFetch.catch(() => {});
        return cached;
      }

      const fresh = await networkFetch;
      if (fresh) return fresh;

      if (request.mode === "navigate" || (isSameOrigin && url.pathname.endsWith(".html"))) {
        const shell = await cache.match("index.html");
        if (shell) return shell;
      }

      return new Response("Offline and not cached yet.", {
        status: 503,
        statusText: "Offline",
      });
    })()
  );
});

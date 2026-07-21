const CACHE_NAME = "monari-shell-v4";
const APP_SHELL = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];
const PRIVATE_PATHS = [
  "/admin",
  "/approvals",
  "/auth",
  "/behaviors",
  "/child",
  "/child-mode",
  "/child-pin",
  "/consent",
  "/learn",
  "/notifications",
  "/onboarding",
  "/records",
  "/reports",
  "/settings",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

// ── 웹 푸시 ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = { title: "Monari", body: "" };
  try { data = event.data.json(); } catch { data.body = event.data.text(); }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "monari-notification",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
      }
      return clients.openWindow("/notifications");
    }),
  );
});

// ── 네트워크 요청 ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    // Authenticated pages must never fall back to a cached response.
    if (url.pathname === "/" || PRIVATE_PATHS.some((path) => url.pathname.startsWith(path))) {
      event.respondWith(fetch(request));
      return;
    }

    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      }),
    );
  }
});

/* ============================================================
   عباقرة - عامل الخدمة: يعمل بدون إنترنت بعد أول زيارة
   ============================================================ */

const CACHE = "abaaqira-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/content.js",
  "./js/art.js",
  "./js/store.js",
  "./js/sound.js",
  "./js/games.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (
    e.request.method !== "GET" ||
    new URL(e.request.url).origin !== location.origin ||
    e.request.url.includes("api.php") ||
    e.request.url.includes("/api/")
  ) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});

// Офлайн-оболочка «Ежедневник». При обновлении файлов увеличь номер версии.
const V = "techo-4";
const CORE = ["./", "index.html", "manifest.webmanifest"];
const EXTRA = ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "pdf.min.js", "pdf.worker.min.js"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE).then(() => Promise.all(EXTRA.map(f => c.add(f).catch(() => null))))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== "techo-fonts").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (FONT_HOSTS.includes(u.hostname)) { // шрифты и данные для PDF: из кэша, а если нет — скачать и запомнить
    e.respondWith(caches.open("techo-fonts").then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { if (n.ok || n.type === "opaque") c.put(e.request, n.clone()); return n; }))));
    return;
  }
  if (u.origin !== location.origin) return; // Supabase — всегда напрямую
  // своё приложение: сначала сеть (чтобы обновления приходили), без сети — из кэша
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});

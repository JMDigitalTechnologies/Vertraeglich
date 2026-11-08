/* Verträglich – Service Worker für den Offline-Betrieb.
   - App-Dateien: erst Netz (damit Updates sofort ankommen), sonst Zwischenspeicher
   - Produktdaten (Open Food Facts): erst Netz, sonst zuletzt geladene Antwort
   - Bibliotheken vom CDN (Scanner, Texterkennung): Zwischenspeicher zuerst */
const CACHE = "vt-v6";
const SHELL = ["./", "index.html", "config.js", "data.js", "engine.js", "app.js", "features.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req){
  const c = await caches.open(CACHE);
  try{
    const res = await fetch(req);
    if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
    return res;
  }catch(err){
    const hit = await c.match(req, {ignoreSearch: req.url.includes("version.json") ? false : true});
    if (hit) return hit;
    if (req.mode === "navigate"){ const shell = await c.match("index.html", {ignoreSearch:true}); if (shell) return shell; }
    throw err;
  }
}
async function cacheFirst(req){
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.endsWith("version.json")) return;              // Update-Prüfung immer live
  if (url.origin === location.origin){ e.respondWith(networkFirst(req)); return; }
  if (/(^|\.)jsdelivr\.net$|unpkg\.com$|tessdata/.test(url.hostname)){ e.respondWith(cacheFirst(req)); return; }
  if (/openfoodfacts\.org$/.test(url.hostname) && url.pathname.includes("/api/v2/product/")){ e.respondWith(networkFirst(req)); return; }
});

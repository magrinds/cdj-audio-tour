const CACHE = 'rhrn-v41';
const ASSETS = ['./', './index.html', './app.js', './plan.js', './tours/campos-do-jordao.js', './manifest.json', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isImg = e.request.destination === 'image' || /upload\.wikimedia\.org/.test(e.request.url);
  if (isImg) {
    e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })));
    return;
  }
  const isApp = url.origin === self.location.origin;
  // app files: network first (so updates land), cache as offline fallback. Navigations ignore the ?tour= query when offline.
  e.respondWith(fetch(isApp ? new Request(e.request.url, {cache: 'no-store'}) : e.request).then(r => { if (isApp || r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, {ignoreSearch: e.request.mode === 'navigate'}).then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});

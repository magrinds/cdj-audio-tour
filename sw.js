const CACHE = 'rhrn-v52';
const MEDIA = 'rhrn-media-v1'; // photos and voice clips survive app updates
const ASSETS = ['./', './index.html', './app.js', './plan.js', './qrcode.js', './tours/campos-do-jordao.js', './manifest.json', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== MEDIA).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isImg = e.request.destination === 'image' || /upload\.wikimedia\.org|\/storage\/v1\/object\/public\/tour-audio\//.test(e.request.url);
  if (isImg) {
    // fetch the whole file (no Range) so it can be cached and replayed offline
    const key = e.request.url, isAudio = /\/tour-audio\//.test(key);
    e.respondWith(caches.open(MEDIA).then(x => x.match(key).then(m => m || fetch(isAudio ? key : e.request).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); x.put(key, c); } return r; }))));
    return;
  }
  const isApp = url.origin === self.location.origin;
  // app files: network first (so updates land), cache as offline fallback. Navigations ignore the ?tour= query when offline.
  e.respondWith(fetch(isApp ? new Request(e.request.url, {cache: 'no-store'}) : e.request).then(r => { if (isApp || r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, {ignoreSearch: e.request.mode === 'navigate'}).then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});

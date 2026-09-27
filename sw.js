const CACHE = 'tzalam-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);

  if (url.origin === location.origin) {
    // הדף עצמו: קודם רשת (כדי לקבל עדכונים), ובלי קליטה מהמטמון
    if (r.mode === 'navigate') {
      e.respondWith(
        fetch(r).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        }).catch(() => caches.match('./index.html'))
      );
      return;
    }
    e.respondWith(caches.match(r).then(m => m || fetch(r)));
    return;
  }

  // גופנים: מהמטמון אם יש, כדי שיעבוד גם בלי קליטה
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
        return res;
      }))
    );
  }
});

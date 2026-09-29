/* ============================================================
   Service worker Katalog PGNet
   - Menyimpan TAMPILAN (index.html, config.js, ikon) di HP.
   - index.html & config.js: ambil yang terbaru dulu, kalau offline
     pakai simpanan  → update tampilan langsung terasa.
   - Data katalog (script.google.com) TIDAK disentuh di sini;
     data diatur oleh index.html (disimpan di browser, cek tiap 5 menit).
   Kalau mengubah daftar file di ASET, naikkan angka VERSI.
   ============================================================ */
var VERSI = 'katalog-pgnet-v2';
var ASET = ['./', './index.html', './config.js', './manifest.json',
            './logo-96.png', './ikon-192.png', './ikon-512.png', './ikon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(ASET); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // data Apps Script dibiarkan lewat

  var halaman = req.mode === 'navigate' || /\/(index\.html|config\.js)?$/.test(url.pathname) || /config\.js$/.test(url.pathname);
  if (halaman) {
    // jaringan dulu → simpan salinan; kalau offline pakai simpanan
    e.respondWith(fetch(req).then(function (res) {
      var salin = res.clone(); caches.open(VERSI).then(function (c) { c.put(req, salin); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
    }));
    return;
  }
  // ikon & manifest: simpanan dulu
  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});

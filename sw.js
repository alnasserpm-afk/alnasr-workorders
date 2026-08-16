const CACHE_NAME = 'alnasr-orders-v2';
const CORE_ASSETS = [
  './work-order-tracker.html',
  './manifest.json'
];

// عند التثبيت: خزّن الملفات الأساسية للأداة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// عند التفعيل: امسح أي نسخ كاش قديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتيجية: جرّب الشبكة الأول دايمًا (مع تجاهل أي كاش HTTP وسيط)، ولو فشلت استخدم الكاش
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSupabaseCall = url.hostname.includes('supabase.co');
  if (isSupabaseCall) return; // سيب طلبات قاعدة البيانات تروح للشبكة مباشرة دايمًا

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

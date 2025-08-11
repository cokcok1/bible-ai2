const CACHE_NAME = 'bible-ai-v2'; // 更新緩存名稱以清除舊緩存
const urlsToCache = [
  './',
  './index.html',
  './chinese_union_trad_trad.txt',
  'https://cdn.tailwindcss.com'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opening cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache failed to open:', error);
      })
  );
  // 立即激活新 Service Worker
  self.skipWaiting();
});

// 攔截請求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 排除 API 請求
  if (url.origin === 'https://grok-proxy-worker.cokcok.workers.dev') {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('API fetch failed:', error);
          return new Response(JSON.stringify({ error: 'API request failed', detail: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 處理其他資源（例如聖經數據、CSS）
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        return fetch(event.request, { cache: 'no-store' })
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, response.clone());
                return response;
              });
          })
          .catch(error => {
            console.error('Fetch failed for resource:', event.request.url, error);
            return new Response('Resource fetch failed', { status: 503 });
          });
      })
  );
});

// 清除舊緩存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 強制客戶端使用新 Service Worker
  self.clients.claim();
});

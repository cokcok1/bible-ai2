const CACHE_NAME="bible-ai-v1";
const urlsToCache=["./","./index.html","./chinese_union_trad_trad.txt"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache)));
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
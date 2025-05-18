const CACHE_NAME = 'image-cache-v1';
const MAX_CACHE_ITEMS = 100;
const FALLBACK_IMAGE_URL = '/placeholder.jpg';
const BASE_URL = 'http://localhost:5000'; // Change to production as needed
// const BASE_URL = 'https://work-t5vf.onrender.com';

const PRECACHE_URLS = [FALLBACK_IMAGE_URL];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.heic', '.avif'];

// 📌 Limit cache size to prevent bloating
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map(key => cache.delete(key)));
  }
}

// ✅ Identify backend image requests
function isBackendImage(url) {
  const isImage = url.startsWith(BASE_URL) &&
                  url.includes('/uploads/') &&
                  IMAGE_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext));

  if (url.startsWith(BASE_URL) && !isImage) {
    // console.log('[SW] Ignored non-image URL:', url);
  }

  return isImage;
}

// 🔁 Convert `.heic` to `.jpg`
function convertHeicUrl(url) {
  return url.toLowerCase().endsWith('.heic') ? url.replace(/\.heic$/i, '.jpg') : url;
}

// 🛡️ Create cross-origin image request
function createCorsRequest(url) {
  return new Request(url, {
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Accept': 'image/*' }
  });
}

// 🧱 Precache fallback image
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

// 🧹 Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// 📥 Fetch and cache image
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  const isImageRequest = request.destination === 'image' || isBackendImage(url.href);
  if (!isImageRequest) return;

  event.respondWith(
    (async () => {
      try {
        // 🧠 Try cache first
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }

        // 🌀 Convert HEIC -> JPG
        if (url.href.toLowerCase().endsWith('.heic')) {
          const jpgUrl = convertHeicUrl(url.href);
          try {
            const jpgRequest = createCorsRequest(jpgUrl);
            const jpgResponse = await fetch(jpgRequest);
            if (jpgResponse.ok) {
              await cache.put(request, jpgResponse.clone());
              await limitCacheSize(CACHE_NAME, MAX_CACHE_ITEMS);
              return jpgResponse;
            }
          } catch (err) {
            console.warn('[SW] HEIC fallback fetch failed:', err);
          }
        }

        // 🌐 Try network fetch
        const corsRequest = createCorsRequest(url.href);
        const networkResponse = await fetch(corsRequest);
        if (!networkResponse.ok) throw new Error(`HTTP ${networkResponse.status}`);

        await cache.put(request, networkResponse.clone());
        await limitCacheSize(CACHE_NAME, MAX_CACHE_ITEMS);
        return networkResponse;

      } catch (error) {
        console.warn('[SW] Fetch failed for:', url.href, error);

        // 🧱 Fallback to stale cache or placeholder
        const stale = await caches.match(request);
        if (stale) {
          // console.log('[SW] Using stale cache:', url.href);
          return stale;
        }

        return caches.match(FALLBACK_IMAGE_URL);
      }
    })()
  );
});

const CACHE_PREFIX = 'draft-lendas-';
const CORE_CACHE = `${CACHE_PREFIX}core-v1`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v1`;
const CORE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/draft-lendas-192.png',
  '/icons/draft-lendas-512.png',
];
const MAX_RUNTIME_ENTRIES = 180;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && ![CORE_CACHE, RUNTIME_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function isPrivateRequest(request, url) {
  return (
    url.pathname === '/admin' ||
    url.pathname.startsWith('/admin/') ||
    url.pathname.startsWith('/rest/v1/') ||
    url.pathname.startsWith('/auth/v1/') ||
    request.headers.has('authorization') ||
    request.headers.has('apikey')
  );
}

async function cacheResponse(cacheName, request, response) {
  if (!response?.ok || response.type !== 'basic') return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (cacheName === RUNTIME_CACHE) {
    const keys = await cache.keys();
    await Promise.all(
      keys.slice(0, Math.max(0, keys.length - MAX_RUNTIME_ENTRIES)).map((key) => cache.delete(key)),
    );
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return cacheResponse(CORE_CACHE, '/', response);
  } catch {
    return (await caches.match('/')) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  return cacheResponse(RUNTIME_CACHE, request, response);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivateRequest(request, url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (['script', 'style', 'font', 'image'].includes(request.destination))
    event.respondWith(cacheFirst(request));
});

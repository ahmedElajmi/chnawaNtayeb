// Service Worker for Chnowa Ntayeb PWA (offline first, safe updates)
//
// - The cache name comes from the build id passed at registration (/sw.js?v=<build>),
//   so every deployment gets a fresh cache and old ones are purged.
// - Pages (navigations) are network-first: users always get the latest version
//   when online, the cached app shell when offline.
// - Static assets are stale-while-revalidate.
// - A new version waits until the page asks it to activate ("Nouvelle version" banner).

const BUILD_ID = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_NAME = `chnowa-ntayeb-${BUILD_ID}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mark.png',
  '/favicon.ico',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Only these third-party hosts are cached (fonts, recipe photos). Never Firestore / Firebase APIs.
const CACHEABLE_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'images.unsplash.com', 'i.ytimg.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  // No skipWaiting() here: the page decides when to switch (see message handler)
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaqueredirect') return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;
  if (!sameOrigin && !CACHEABLE_HOSTS.includes(url.hostname)) return;

  // Pages: network first, cached shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putInCache('/index.html', response);
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          putInCache(request, response);
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

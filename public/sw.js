/* 吉時行樂 service worker: makes the site installable and usable offline.
 *
 * - App shell (HTML, CSS, JS, icons) is precached on install. `npm run build:static`
 *   fills in VERSION and PRECACHE; in the Node dev server they stay empty.
 * - Same-origin pages, scripts and styles: network first, so an online visit always
 *   gets the latest deploy; the cached copy is used offline or when the network is slow.
 * - Images and Google Fonts: cache first, filled as they are used.
 */
const VERSION = 'dev';
const PRECACHE = [];

const SHELL_PREFIX = 'lucky-hour-shell-';
const SHELL_CACHE = `${SHELL_PREFIX}${VERSION}`;
const RUNTIME_CACHE = 'lucky-hour-runtime-v1';
const NETWORK_TIMEOUT_MS = 4000;
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && (request.mode === 'navigate' || /\.(?:html|js|css|json|webmanifest)$/.test(url.pathname))) {
    event.respondWith(networkFirst(event, request));
  } else if (sameOrigin || FONT_HOSTS.has(url.hostname)) {
    event.respondWith(cacheFirst(event, request));
  }
});

// The runtime cache holds what the last online visit fetched, so it wins over the
// install-time shell; a page falls back to the cached app shell.
async function fromCache(request) {
  const isPage = request.mode === 'navigate';
  const runtime = await caches.open(RUNTIME_CACHE);
  const hit = (await runtime.match(request, { ignoreSearch: isPage })) || (await caches.match(request, { ignoreSearch: isPage }));
  if (hit || !isPage) return hit;
  return (await caches.match('./')) || caches.match('index.html');
}

function remember(event, request, response) {
  if (!response || !response.ok) return;
  const copy = response.clone();
  event.waitUntil(caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {}));
}

async function networkFirst(event, request) {
  const network = fetch(request).then((response) => {
    remember(event, request, response);
    return response;
  });
  network.catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    const response = await Promise.race([network, timeout]);
    if (response) return response;
    // Slow network: answer from cache when we can, otherwise keep waiting.
    return (await fromCache(request)) || network;
  } catch (err) {
    const cached = await fromCache(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(event, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  remember(event, request, response);
  return response;
}

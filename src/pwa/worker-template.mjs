// Only public, versioned application assets belong in this cache.
// Account data and pending operations stay in the existing IndexedDB layer.
export function buildWorker({ version, assets }) {
  return `
const NAME = 'meu-agro-shell-${version}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(NAME);
  await cache.addAll(ASSETS.map(path => new Request(path, {cache: 'reload'})));
  // No skipWaiting: an open form must never be replaced by an update.
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith('meu-agro-shell-') && key !== NAME) await caches.delete(key);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Never intercept API, storage, tokens or third-party requests.
  if (url.pathname.startsWith('/auth/v1/') || url.pathname.startsWith('/rest/') ||
      url.pathname.startsWith('/functions/') || url.pathname.startsWith('/storage/')) return;
  if (request.mode === 'navigate' && !/\\.[a-z0-9]+$/i.test(url.pathname)) {
    // Use the index belonging to this worker, avoiding old/new chunk mixtures.
    // No callback URL, code, user response or query is ever written to CacheStorage.
    event.respondWith(caches.open(NAME).then(async cache =>
      (await cache.match('/index.html')) || fetch(request)));
  } else if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(NAME).then(async cache =>
      (await cache.match(url.pathname)) || fetch(request)));
  }
});
`;
}

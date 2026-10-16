import { createHash } from 'node:crypto';
export function offlineShell() {
  return {
    name: 'meu-agro-offline-shell',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter((name) =>
        /\.(html|js|css|svg|png|webp|woff2?)$/.test(name),
      );
      const hash = createHash('sha256')
        .update(files.join('|') + String(bundle['index.html']?.source || ''))
        .digest('hex')
        .slice(0, 16);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const NAME = 'meu-agro-shell-${hash}';
const ASSETS = ${JSON.stringify(files.map((name) => '/' + name))};
self.addEventListener('install', event => event.waitUntil(caches.open(NAME).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('meu-agro-shell-') && key !== NAME) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(NAME).then(cache => cache.match('/index.html'))));
  } else if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(NAME).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
`,
      });
    },
  };
}

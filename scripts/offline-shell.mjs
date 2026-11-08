import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildWorker } from '../src/pwa/worker-template.mjs';
const pwaFiles = [
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];
export function offlineShell() {
  return {
    name: 'meu-agro-offline-shell',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname.slice(1);
        if (!pwaFiles.includes(pathname)) return next();
        res.setHeader(
          'Content-Type',
          pathname.endsWith('.png') ? 'image/png' : 'application/manifest+json',
        );
        res.end(readFileSync(new URL('../native/pwa/' + pathname, import.meta.url)));
      });
    },
    generateBundle(_options, bundle) {
      // Emit these through Vite as well, so installation waits for every icon.
      const pwa = pwaFiles;
      for (const name of pwa)
        this.emitFile({
          type: 'asset',
          fileName: name,
          source: readFileSync(new URL('../native/pwa/' + name, import.meta.url)),
        });
      const files = Object.keys(bundle).filter((name) =>
        /\.(html|js|css|svg|png|webp|woff2?)$/.test(name),
      );
      const hash = createHash('sha256')
        .update(
          files
            .map((name) => name + ':' + (bundle[name].code || bundle[name].source || ''))
            .join('|') +
            pwa
              .map((name) =>
                readFileSync(new URL('../native/pwa/' + name, import.meta.url)).toString('base64'),
              )
              .join('|'),
        )
        .digest('hex')
        .slice(0, 16);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: buildWorker({
          version: hash,
          assets: [...new Set([...files, ...pwa])].map((name) => '/' + name),
        }),
      });
    },
  };
}

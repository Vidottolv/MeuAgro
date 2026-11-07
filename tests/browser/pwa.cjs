const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile, mkdir } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = resolve(process.env.PWA_TEST_DIST || 'dist');
  const screenshots = resolve(process.env.PWA_TEST_SCREENSHOTS || '../work/pwa-browser-qa');
  await mkdir(screenshots, { recursive: true });
  let version = 1;
  const originalWorker = await readFile(resolve(root, 'sw.js'), 'utf8');
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (!extname(path)) path = '/index.html';
      const file = resolve(root, '.' + path);
      if (!file.startsWith(root + sep)) throw Error('path');
      const data =
        path === '/sw.js'
          ? originalWorker.replace(
              /meu-agro-shell-([a-f0-9]+)/,
              'meu-agro-shell-browser-v' + version,
            )
          : await readFile(file);
      res.writeHead(200, {
        'content-type':
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.webmanifest': 'application/manifest+json',
            '.png': 'image/png',
          }[extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((done) => server.listen(4194, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    });
    await context.route('http://127.0.0.1:54321/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4194/login');
    await page.locator('input[type=email]').waitFor();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 30000 });
    await page.getByText('Adicionar MeuAgro à tela inicial', { exact: true }).click();
    await page.getByText(/No Safari, toque em Compartilhar/).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const manifest = await (
      await page.request.get('http://127.0.0.1:4194/manifest.webmanifest')
    ).json();
    assert.equal(manifest.display, 'standalone');
    await page.screenshot({ path: resolve(screenshots, 'iphone-install.png'), fullPage: true });
    await page.evaluate(
      () =>
        new Promise((done, reject) => {
          const request = indexedDB.open('pwa-pending-proof', 1);
          request.onupgradeneeded = () => request.result.createObjectStore('records');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction('records', 'readwrite');
            tx.objectStore('records').put(
              { photo: new Blob(['pending-photo']), draft: 'not-sent' },
              'pending',
            );
            tx.oncomplete = () => {
              db.close();
              done();
            };
          };
        }),
    );
    await context.setOffline(true);
    await page.reload();
    await page.locator('input[type=email]').waitFor();
    await page.screenshot({ path: resolve(screenshots, 'iphone-offline.png'), fullPage: true });
    await context.setOffline(false);
    const second = await context.newPage();
    await second.goto('http://127.0.0.1:4194/login');
    await second.locator('input[type=email]').waitFor();
    await page.locator('input[type=email]').fill('nao-salvo@example.test');
    version = 2;
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg.update();
    });
    await page.waitForFunction(
      async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
      { timeout: 30000 },
    );
    await page.getByText('Nova versão do MeuAgro pronta.', { exact: true }).waitFor();
    assert.equal(await page.locator('input[type=email]').inputValue(), 'nao-salvo@example.test');
    assert.match(
      await page.evaluate(
        async () => (await navigator.serviceWorker.getRegistration()).active.scriptURL,
      ),
      /sw.js/,
    );
    assert.ok((await page.evaluate(() => caches.keys())).includes('meu-agro-shell-browser-v1'));
    await page.screenshot({
      path: resolve(screenshots, 'update-preserves-form.png'),
      fullPage: true,
    });
    await page.close();
    // One remaining tab still owns the old worker.
    assert.equal(
      await second.evaluate(
        async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
      ),
      true,
    );
    await second.close();
    const reopened = await context.newPage();
    await reopened.goto('http://127.0.0.1:4194/login');
    await reopened.locator('input[type=email]').waitFor();
    await reopened.waitForFunction(
      async () => {
        const keys = await caches.keys();
        return (
          keys.includes('meu-agro-shell-browser-v2') && !keys.includes('meu-agro-shell-browser-v1')
        );
      },
      { timeout: 30000 },
    );
    const recovered = await reopened.evaluate(
      () =>
        new Promise((done, reject) => {
          const request = indexedDB.open('pwa-pending-proof', 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result,
              get = db.transaction('records').objectStore('records').get('pending');
            get.onsuccess = async () => {
              done({ draft: get.result.draft, photo: await get.result.photo.text() });
              db.close();
            };
          };
        }),
    );
    assert.deepEqual(recovered, { draft: 'not-sent', photo: 'pending-photo' });
    const keys = await reopened.evaluate(async () => {
      const values = [];
      for (const key of await caches.keys())
        for (const request of await (await caches.open(key)).keys()) values.push(request.url);
      return values;
    });
    assert.ok(!keys.some((key) => /54321|code=|token=/.test(key)));
    assert.deepEqual(errors, []);
    const signed = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'pwa@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { full_name: 'Piloto PWA' },
    };
    const token =
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
      '.' +
      Buffer.from(
        JSON.stringify({
          sub: user.id,
          role: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url') +
      '.test';
    const session = {
      user,
      access_token: token,
      refresh_token: 'test-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
    };
    await signed.addInitScript(
      (s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)),
      session,
    );
    await signed.route('http://127.0.0.1:54321/**', (route) => {
      const url = new URL(route.request().url());
      const data =
        url.pathname === '/auth/v1/user'
          ? user
          : url.pathname === '/auth/v1/token'
            ? session
            : url.pathname.endsWith('/profiles')
              ? { id: user.id, full_name: 'Piloto PWA' }
              : [];
      return route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        },
        body: JSON.stringify(data),
      });
    });
    const settings = await signed.newPage();
    await settings.goto('http://127.0.0.1:4194/more/settings');
    await settings.getByRole('heading', { name: 'MeuAgro na tela inicial' }).waitFor();
    assert.equal(
      await settings.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await settings.screenshot({ path: resolve(screenshots, 'pwa-settings.png'), fullPage: true });
    await settings.goto('http://127.0.0.1:4194/more/visits?new=1');
    await settings.getByRole('button', { name: 'Tirar foto', exact: true }).waitFor();
    assert.equal(await settings.locator('input[capture=environment]').count(), 1);
    await signed.close();
    console.log(
      'PASS: manifesto, instruções iPhone em viewport móvel, abertura offline, atualização aguardando duas abas, formulário preservado, ativação ao fechar todas, IndexedDB e foto preservados; nenhuma API real.',
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

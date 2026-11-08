const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile, mkdir } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = resolve(process.env.HELP_TEST_DIST || 'dist'),
    qa = resolve('../work/help-brand-qa');
  await mkdir(qa, { recursive: true });
  const server = createServer(async (req, res) => {
    try {
      let p = new URL(req.url, 'http://localhost').pathname;
      if (!extname(p)) p = '/index.html';
      const file = resolve(root, '.' + p);
      if (!file.startsWith(root + sep)) throw Error();
      const bytes = await readFile(file);
      res.writeHead(200, {
        'content-type':
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.webmanifest': 'application/manifest+json',
          }[extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((done) => server.listen(4197, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      errors = [];
    await context.route('http://127.0.0.1:54321/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4197/login');
    await page.getByRole('link', { name: 'Como usar o MeuAgro' }).waitFor();
    const brand = page.locator('.brand__mark img');
    await brand.waitFor();
    assert.equal(await brand.getAttribute('src'), '/icons/icon-512.png');
    assert.equal(await brand.evaluate((img) => img.complete && img.naturalWidth === 512), true);
    await page.screenshot({ path: resolve(qa, 'login-new-brand.png'), fullPage: true });
    await page.getByRole('link', { name: 'Como usar o MeuAgro' }).click();
    await page.getByRole('heading', { name: 'Central de ajuda do MeuAgro' }).waitFor();
    await page.getByLabel('O que você precisa fazer?').fill('inteligência artificial');
    await page.locator('#help-ia-visita summary').click();
    await page.getByText(/O apoio atual usa texto/).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: resolve(qa, 'help-search-ai-mobile.png'), fullPage: true });
    await page.goto('http://127.0.0.1:4197/help?topic=ndvi');
    await page.locator('#help-ndvi[open]').waitFor();
    assert.equal(
      await page
        .getByRole('link', { name: 'Abrir funcionalidade', exact: true })
        .first()
        .getAttribute('href'),
      '/more/satellite',
    );
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 30000 });
    await context.setOffline(true);
    await page.reload();
    await page.locator('#help-ndvi[open]').waitFor();
    await page.getByLabel('O que você precisa fazer?').fill('sincronização');
    assert.ok((await page.locator('.help-article').count()) > 0);
    await context.setOffline(false);
    await page.getByLabel('Tema da ajuda').selectOption('all');
    assert.equal(await page.locator('.help-article').count(), 12);
    await page.getByRole('button', { name: /Mostrar mais tópicos/ }).click();
    assert.equal(await page.locator('.help-article').count(), 24);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://127.0.0.1:4197/help?topic=ndvi');
    await page.locator('#help-ndvi[open]').waitFor();
    await page.screenshot({ path: resolve(qa, 'help-desktop.png'), fullPage: true });
    const signed = await browser.newContext({ viewport: { width: 320, height: 780 } });
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'help@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { full_name: 'Piloto MeuAgro' },
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
      const p = new URL(route.request().url()).pathname;
      const data =
        p === '/auth/v1/user'
          ? user
          : p === '/auth/v1/token'
            ? session
            : p.endsWith('/profiles')
              ? { id: user.id, full_name: 'Piloto MeuAgro' }
              : p.endsWith('/rpc/app_is_platform_admin')
                ? false
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
    const inside = await signed.newPage();
    inside.on('pageerror', (e) => errors.push(e.message));
    await inside.goto('http://127.0.0.1:4197/more');
    await inside.getByRole('link', { name: 'Abrir central de ajuda' }).waitFor();
    assert.equal(
      await inside.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await inside.getByRole('link', { name: 'Abrir central de ajuda' }).click();
    await inside.getByRole('heading', { name: 'Central de ajuda do MeuAgro' }).waitFor();
    assert.equal(
      await inside.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await inside.screenshot({ path: resolve(qa, 'help-320px.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: ícone único, ajuda pública e autenticada, busca, links, paginação, tema NDVI por URL, leitura offline, layout 320/390/1280px; nenhuma API real.',
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

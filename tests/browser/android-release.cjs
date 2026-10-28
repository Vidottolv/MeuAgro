const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = resolve(process.env.VISIT_TEST_DIST || 'dist');
  const server = createServer(async (req, res) => {
    try {
      let p = new URL(req.url, 'http://localhost').pathname;
      if (!extname(p)) p = '/index.html';
      const file = resolve(root, '.' + p);
      if (!file.startsWith(root + sep)) throw Error();
      res.writeHead(200, {
        'content-type':
          { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ||
          'application/octet-stream',
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((done) => server.listen(4187, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'piloto@example.test',
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
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      const headers = {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      };
      if (req.method() === 'OPTIONS') return route.fulfill({ headers, body: '{}' });
      let data = [];
      if (url.pathname === '/auth/v1/user') data = user;
      else if (url.pathname === '/auth/v1/token') data = session;
      else if (url.pathname.endsWith('/profiles'))
        data = { id: user.id, full_name: 'Piloto MeuAgro' };
      else if (url.pathname.endsWith('/rpc/app_is_platform_admin')) data = false;
      await route.fulfill({ headers, body: JSON.stringify(data) });
    });
    const page = await context.newPage(),
      errors = [];
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      (s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)),
      session,
    );
    await page.goto('http://127.0.0.1:4187/more/profile');
    await page.getByRole('heading', { name: 'Versão do aplicativo' }).waitFor();
    const release = JSON.parse(await readFile(resolve('native/android/release.json'), 'utf8'));
    await page
      .getByText(
        `Versão web: ${release.versionName} • Build ${release.versionCode} • ${release.channel === 'pilot' ? 'Piloto' : 'Produção'}.`,
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page
        .getByRole('link', { name: 'Diagnóstico e privacidade', exact: true })
        .getAttribute('href'),
      '/more/operations',
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: '../work/android-release-profile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: versão centralizada no perfil móvel e atalho para diagnóstico; nenhuma API real.',
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

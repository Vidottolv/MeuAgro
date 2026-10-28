const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { farmWorkflowFixture } = await import('../farm-workflow-fixture.mjs');
  const f = await farmWorkflowFixture();
  const harvest = await f.harvest();
  await f.sale(harvest);
  let queue = Promise.resolve();

  const root = resolve(process.env.VISIT_TEST_DIST || 'dist');
  const user = {
    id: f.user,
    email: 'admin@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    user_metadata: { full_name: 'Admin Teste' },
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
  const server = createServer(async (req, res) => {
    try {
      let path = new URL(req.url, 'http://localhost').pathname;
      if (!extname(path)) path = '/index.html';
      const file = resolve(root, '.' + path);
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
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const errors = [];
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      const headers = {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers, body: '{}' });

      const job = queue.then(async () => {
        let data = [],
          status = 200;
        try {
          if (url.pathname === '/auth/v1/user') data = user;
          else if (url.pathname === '/auth/v1/token') data = session;
          else if (url.pathname.endsWith('/rpc/app_farm_workflow')) {
            await f.as(f.user);
            const body = req.postDataJSON();
            data = await f.rpc('app_farm_workflow', [body.p_cycle, body.p_offset]);
          } else if (url.pathname.endsWith('/rpc/app_is_platform_admin')) data = false;
        } catch (e) {
          status = 403;
          data = { code: e.code, message: e.message };
        }
        await route.fulfill({ status, headers, body: JSON.stringify(data) });
      });
      queue = job.catch(() => {});
      await job;
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      (session) => localStorage.setItem('sb-127-auth-token', JSON.stringify(session)),
      session,
    );

    await page.goto('http://127.0.0.1:4187/more/farm-workflow');
    await page
      .getByRole('heading', { name: 'Conferência da rotina agrícola', exact: true })
      .waitFor();
    await page.getByText(/Receita das vendas de colheitas:.*80,00/).waitFor();
    await page.getByRole('link', { name: 'Abrir plantio', exact: true }).waitFor();
    assert.equal(
      await page.getByRole('link', { name: 'Abrir plantio', exact: true }).getAttribute('href'),
      '/plantings/' + f.cycle,
    );
    await page.screenshot({ path: '../work/farm-mobile.png', fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await context.setOffline(true);
    await page.getByText(/Receita das vendas de colheitas/).waitFor({ state: 'hidden' });
    await context.setOffline(false);
    await page.getByText(/Receita das vendas de colheitas:.*80,00/).waitFor();
    await page.goto('http://127.0.0.1:4187/more/farm-workflow?cycle=' + f.ids[10]);
    await page
      .getByRole('alert')
      .filter({ hasText: 'Plantio indisponível nesta conta.' })
      .waitFor();
    assert.equal(await page.getByText(/Receita das vendas de colheitas/).count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      'Conferência agrícola no celular: receita real do banco local, isolamento, links e offline OK.',
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
    await f.db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

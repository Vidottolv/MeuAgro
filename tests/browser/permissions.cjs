const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { permissionsFixture } = await import('../permissions-fixture.mjs');
  const f = await permissionsFixture();
  await f.sale();
  let queue = Promise.resolve();
  let denied = false;

  const root = resolve(process.env.VISIT_TEST_DIST || 'dist');
  const user = {
    id: f.ids[1],
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
        await f.as(2);
        let data = [],
          status = 200;
        try {
          if (url.pathname === '/auth/v1/user') data = user;
          else if (url.pathname === '/auth/v1/token') data = session;
          else if (url.pathname.includes('/rpc/')) {
            const name = url.pathname.split('/').at(-1),
              body = req.postDataJSON() || {};
            const specs = {
              trade_sales_report: ['p_seller', 'p_from', 'p_to', 'p_offset'],
              trade_product_ranking: ['p_seller', 'p_year', 'p_month'],
              app_permissions_context: [],
            };
            if (name === 'app_is_platform_admin') data = false;
            else if (name in specs) {
              if (denied && name === 'trade_sales_report')
                throw Object.assign(Error('Acesso revogado'), { code: '42501' });
              data = await f.rpc(
                name,
                specs[name].map((k) => body[k]),
              );
            }
          } else if (url.pathname.startsWith('/rest/v1/')) {
            const table = url.pathname.split('/').at(-1);
            assert.ok(
              ['commerce_accounts', 'commerce_memberships', 'commerce_sellers'].includes(table),
            );
            data = (await f.db.query('select * from public.' + table)).rows;
            if (req.headers()['accept']?.includes('vnd.pgrst.object')) data = data[0] || null;
          }
        } catch (e) {
          status = 403;
          data = { code: e.code || '42501', message: e.message };
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

    const address =
      'http://127.0.0.1:4187/consultor/resultados?' +
      new URLSearchParams({ seller: f.seller, from: f.from, to: f.to });
    await page.goto(address);
    await page.getByRole('heading', { name: 'Minhas vendas', exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole('heading', { name: 'Comissões das vendas recebidas', exact: true })
        .count(),
      0,
    );
    await page.getByText(/As comissões estão ocultas/).waitFor();
    await queue;
    await f.role(2, true);
    await page.reload();
    await page
      .getByRole('heading', { name: 'Comissões das vendas recebidas', exact: true })
      .waitFor();
    await page.screenshot({ path: '../work/permissions-mobile.png', fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await context.setOffline(true);
    await page
      .getByRole('heading', { name: 'Comissões das vendas recebidas', exact: true })
      .waitFor({ state: 'hidden' });
    await context.setOffline(false);
    await page
      .getByRole('heading', { name: 'Comissões das vendas recebidas', exact: true })
      .waitFor();
    denied = true;
    await page.reload();
    await page.getByText(/Acesso revogado/).waitFor();
    assert.equal(
      await page
        .getByRole('heading', { name: 'Comissões das vendas recebidas', exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      'Permissões no celular: gerente sem/com autorização, limpeza offline e falha de acesso OK.',
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

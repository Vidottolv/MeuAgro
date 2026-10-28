const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { profileOnboardingFixture } = await import('../profile-onboarding-fixture.mjs');
  const f = await profileOnboardingFixture();
  f.asActor(f.other);
  const root = resolve(process.env.VISIT_TEST_DIST || 'dist');
  const user = {
    id: f.other,
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
      let data = [],
        status = 200;
      if (url.pathname === '/auth/v1/user') data = user;
      else if (url.pathname === '/auth/v1/token') data = session;
      else if (url.pathname === '/functions/v1/billing-asaas') {
        const response = await f.request(req.postDataJSON());
        data = response.body;
        status = response.status;
      } else if (url.pathname.includes('/rpc/')) {
        const name = url.pathname.split('/').at(-1);
        if (name.startsWith('app_')) {
          const result = await f.userRpc(name, req.postDataJSON() || {}, f.other);
          if (result.error) {
            status = 400;
            data = result.error;
          } else data = result.data;
        }
      }
      await route.fulfill({ status, headers, body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      (session) => localStorage.setItem('sb-127-auth-token', JSON.stringify(session)),
      session,
    );

    await page.goto('http://127.0.0.1:4187/more/account-plan');
    const panel = page.locator('section.profile-onboarding');
    await panel.getByLabel('Roteiro de uso', { exact: true }).waitFor();
    assert.equal(
      await panel.getByLabel('Roteiro de uso', { exact: true }).inputValue(),
      'producer',
    );
    await panel.getByLabel('Roteiro de uso', { exact: true }).selectOption('manager');
    await panel.getByText(/Nenhum vínculo ativo de empresa/).waitFor();
    assert.equal(await panel.getByRole('link', { name: 'Abrir gestão', exact: true }).count(), 0);
    await panel.getByLabel('Li as orientações deste roteiro', { exact: true }).check();
    await panel.getByRole('button', { name: 'Salvar meu roteiro', exact: true }).click();
    await panel.getByText(/Orientações revisadas em/).waitFor();
    await page.reload();
    await panel.getByText(/Orientações revisadas em/).waitFor();
    assert.equal(await panel.getByLabel('Roteiro de uso', { exact: true }).inputValue(), 'manager');
    assert.equal(
      await panel.getByLabel('Li as orientações deste roteiro', { exact: true }).isChecked(),
      true,
    );
    await f.drain();
    await f.db.exec('reset role');
    const membership = crypto.randomUUID();
    await f.db.query('insert into commerce_accounts values($1,true)', [f.other]);
    await f.db.query(
      "insert into commerce_memberships(id,seller_id,user_id,active,management_role) values($1,$2,$3,true,'manager')",
      [membership, f.seller, f.other],
    );
    await panel.getByRole('button', { name: 'Atualizar meu roteiro', exact: true }).click();
    await panel.getByRole('link', { name: 'Abrir gestão', exact: true }).waitFor();
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '../work/profile-mobile.png', fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await f.drain();
    await f.db.exec('reset role');
    await f.db.query('update commerce_memberships set active=false where id=$1', [membership]);
    await panel.getByRole('button', { name: 'Atualizar meu roteiro', exact: true }).click();
    await panel
      .getByRole('link', { name: 'Abrir gestão', exact: true })
      .waitFor({ state: 'hidden' });
    await panel.getByLabel('Roteiro de uso', { exact: true }).selectOption('independent');
    assert.equal(
      await panel.getByLabel('Li as orientações deste roteiro', { exact: true }).isChecked(),
      false,
    );
    assert.equal(f.provider.posts.length, 0);
    assert.equal(f.provider.deletes, 0);
    assert.deepEqual(errors, []);
    await context.setOffline(true);
    await panel.getByLabel('Roteiro de uso', { exact: true }).waitFor({ state: 'hidden' });
    console.log(
      'Roteiros: persistência, revisão, gerente autorizado/revogado, tela móvel e offline OK.',
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

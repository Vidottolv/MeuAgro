const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { checkoutFixture } = await import('../checkout-fixture.mjs');
  const f = await checkoutFixture();
  f.asActor(f.user);
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
          const result = await f.userRpc(name, req.postDataJSON() || {});
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
    await page.goto('http://127.0.0.1:4187/more/platform-admin');
    await page
      .getByRole('button', { name: 'Editar condições da contratação', exact: true })
      .click();
    await page.getByLabel('Fornecedor / razão social', { exact: true }).fill('MeuAgro Teste');
    await page.getByLabel('E-mail de atendimento', { exact: true }).fill('support@example.test');
    await page.getByLabel('Versão das condições', { exact: true }).fill('piloto-2');
    await page
      .getByLabel('Motivo da alteração', { exact: true })
      .fill('Configuração comercial de teste');
    await page.getByLabel('Revisei as condições e confirmo a alteração.', { exact: true }).check();
    await page
      .getByRole('button', { name: 'Salvar condições da contratação', exact: true })
      .click();
    await page.getByRole('status').filter({ hasText: 'Registro confirmado.' }).waitFor();
    await page.goto('http://127.0.0.1:4187/more/account-plan');
    const checkout = page.locator('section.checkout-panel');
    try {
      await checkout.getByLabel('Plano para contratar', { exact: true }).selectOption('company10');
    } catch (e) {
      console.error((await page.locator('body').innerText()).slice(0, 8000));
      throw e;
    }
    await checkout.getByRole('button', { name: 'Revisar contratação', exact: true }).click();
    await checkout.getByRole('heading', { name: 'Revise a oferta', exact: true }).waitFor();
    assert.equal(f.provider.posts.length, 0);
    await checkout.getByLabel('Nome ou razão social', { exact: true }).fill('Pagador Teste');
    await checkout.getByLabel('E-mail de cobrança', { exact: true }).fill('payer@example.test');
    await checkout.getByLabel('CPF ou CNPJ', { exact: true }).fill('12345678909');
    await checkout.getByLabel('Li as condições e autorizo', { exact: false }).check();
    await checkout
      .getByRole('button', { name: 'Confirmar assinatura mensal', exact: true })
      .click();
    await checkout.getByRole('heading', { name: 'Aguardando pagamento', exact: true }).waitFor();
    assert.equal(
      await checkout
        .getByRole('link', { name: 'Abrir pagamento no Asaas', exact: true })
        .getAttribute('href'),
      'https://sandbox.asaas.com/i/test',
    );
    assert.equal(f.provider.posts.length, 2);
    assert.equal(
      await page.evaluate(() => JSON.stringify(localStorage).includes('12345678909')),
      false,
    );
    f.provider.payments[0].status = 'RECEIVED';
    await f.cool();
    await checkout.getByRole('button', { name: 'Atualizar contratação', exact: true }).click();
    await checkout.getByRole('heading', { name: 'Contratação concluída', exact: true }).waitFor();
    await checkout.getByText(/Vigência atual:/).waitFor();
    assert.equal(f.provider.posts.length, 2);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/checkout-mobile.png', fullPage: true });
    await context.setOffline(true);
    await page
      .getByText('Conecte-se para importar cadastros e consultar o plano.', { exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole('heading', { name: 'Contratação concluída', exact: true }).count(),
      0,
    );
    await context.setOffline(false);
    await checkout.getByRole('heading', { name: 'Contratação concluída', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      'PASS: condições administrativas, oferta sem cobrança, aceite, criação, pagamento hospedado, confirmação, mobile, privacidade e offline; SQL e handler reais com Asaas simulado.',
    );
    await context.close();
  } finally {
    await browser.close();
    server.close();
    await f.db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

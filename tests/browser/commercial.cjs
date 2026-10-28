const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { commercialFixture } = await import('../commercial-fixture.mjs');
  const f = await commercialFixture();
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
    let catalog = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Catálogo comercial', exact: true }) });
    await catalog
      .locator('li')
      .filter({ hasText: 'Empresa — até 10 representantes' })
      .getByRole('button', { name: 'Editar', exact: true })
      .click();
    await page
      .getByLabel('Dias de teste gratuito (0 desativa; máximo 30)', { exact: true })
      .fill('7');
    await catalog.getByLabel('Motivo', { exact: true }).fill('Liberar teste comercial no piloto');
    await page.getByLabel('Confirmo a alteração do catálogo.', { exact: true }).check();
    await page.getByRole('button', { name: 'Salvar catálogo', exact: true }).click();
    await catalog
      .getByRole('button', { name: 'Salvar catálogo', exact: true })
      .waitFor({ state: 'hidden' });
    await page.goto('http://127.0.0.1:4187/more/account-plan');
    let commercial = page.locator('section.commercial-panel');
    await commercial.getByLabel('Plano comercial', { exact: true }).selectOption('company10');
    await commercial.getByLabel('Confirmo o teste de', { exact: false }).check();
    await commercial.getByRole('button', { name: 'Iniciar teste gratuito', exact: true }).click();
    await commercial.getByText(/Fim do teste gratuito:/).waitFor();
    assert.equal(f.provider.posts.length, 0);
    const checkout = page.locator('section.checkout-panel');
    await checkout.getByLabel('Plano para contratar', { exact: true }).selectOption('company10');
    await checkout.getByRole('button', { name: 'Revisar contratação', exact: true }).click();
    await checkout.getByRole('heading', { name: 'Revise a oferta', exact: true }).waitFor();
    await checkout.getByLabel('Nome ou razão social', { exact: true }).fill('Teste Comercial');
    await checkout.getByLabel('E-mail de cobrança', { exact: true }).fill('payer@example.test');
    await checkout.getByLabel('CPF ou CNPJ', { exact: true }).fill('12345678909');
    await checkout.getByLabel('Li as condições e autorizo', { exact: false }).check();
    await checkout
      .getByRole('button', { name: 'Confirmar assinatura mensal', exact: true })
      .click();
    await checkout.getByRole('heading', { name: 'Aguardando pagamento', exact: true }).waitFor();
    f.provider.payments[0].status = 'RECEIVED';
    await f.cool();
    await checkout.getByRole('button', { name: 'Atualizar contratação', exact: true }).click();
    await checkout.getByRole('heading', { name: 'Contratação concluída', exact: true }).waitFor();
    await page.goto('http://127.0.0.1:4187/more/platform-admin');
    catalog = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Catálogo comercial', exact: true }) });
    await catalog
      .locator('li')
      .filter({ hasText: 'Empresa — até 10 representantes' })
      .getByRole('button', { name: 'Editar', exact: true })
      .click();
    await page.getByLabel('Nome comercial', { exact: true }).fill('Empresa revisada');
    await page.getByLabel('Mensalidade em centavos', { exact: true }).fill('2000');
    await page.getByLabel('Total de pessoas, incluindo o titular', { exact: true }).fill('12');
    await catalog
      .getByLabel('Motivo', { exact: true })
      .fill('Nova oferta sem alterar contratos existentes');
    await page.getByLabel('Confirmo a alteração do catálogo.', { exact: true }).check();
    await page.getByRole('button', { name: 'Salvar catálogo', exact: true }).click();
    await catalog
      .getByRole('button', { name: 'Salvar catálogo', exact: true })
      .waitFor({ state: 'hidden' });
    await page.goto('http://127.0.0.1:4187/more/account-plan');
    commercial = page.locator('section.commercial-panel');
    await commercial
      .getByText(/Condições da sua conta:/)
      .filter({ hasText: '11 pessoas' })
      .waitFor();
    await commercial.getByLabel('Plano comercial', { exact: true }).selectOption('company10');
    await commercial
      .getByRole('button', { name: 'Solicitar proposta de troca', exact: true })
      .click();
    await commercial.getByText('Solicitada', { exact: true }).waitFor();
    await page.goto('http://127.0.0.1:4187/more/platform-admin');
    const admin = page.locator('section.admin-commercial');
    await admin.getByRole('button', { name: /Revisar troca/ }).click();
    await admin
      .getByLabel('Motivo / mensagem ao titular', { exact: true })
      .fill('Troca após fim da vigência, sem prorrata');
    await admin
      .getByLabel('Revisei o contrato, a equipe e a vigência que deve ser preservada.', {
        exact: true,
      })
      .check();
    await admin.getByRole('button', { name: 'Emitir proposta para aceite', exact: true }).click();
    await admin.getByText('Aguardando aceite', { exact: true }).waitFor();
    await page.goto('http://127.0.0.1:4187/more/account-plan');
    commercial = page.locator('section.commercial-panel');
    await commercial.getByText('Proposta para revisar', { exact: true }).waitFor();
    await commercial.getByLabel('Li a proposta e aceito', { exact: false }).check();
    await commercial
      .getByRole('button', { name: 'Aceitar proposta de troca', exact: true })
      .click();
    await commercial.getByText('Aceita — aguardando execução assistida', { exact: true }).waitFor();
    await commercial
      .getByText(/Condições da sua conta:/)
      .filter({ hasText: '11 pessoas' })
      .waitFor();
    assert.equal(f.provider.posts.length, 2);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/commercial-mobile.png', fullPage: true });
    await context.setOffline(true);
    await page
      .getByText('Conecte-se para importar cadastros e consultar o plano.', { exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole('heading', { name: 'Condições comerciais, teste e troca de plano', exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS: configuração comercial, teste sem cobrança, contratação, preservação de limites, proposta, aceite, mobile e limpeza offline com PostgreSQL/handler reais e Asaas simulado.',
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

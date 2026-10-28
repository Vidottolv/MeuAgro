const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { operationsFixture } = await import('../operations-fixture.mjs');
  const f = await operationsFixture();
  let queue = Promise.resolve();
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
  const errors = [];
  async function open(actor, admin = false) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      acceptDownloads: true,
    });
    const user = {
      id: actor,
      email: 'test@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { full_name: 'Teste' },
    };
    const token =
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
      '.' +
      Buffer.from(
        JSON.stringify({
          sub: actor,
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
      const job = queue.then(async () => {
        let data = [],
          status = 200;
        try {
          if (url.pathname === '/auth/v1/user') data = user;
          else if (url.pathname === '/auth/v1/token') data = session;
          else if (url.pathname.includes('/rpc/')) {
            const name = url.pathname.split('/').pop(),
              b = req.postDataJSON();
            await f.as(actor);
            const args = {
              app_operations_context: [],
              app_operations_admin: [b.p_offset],
              app_privacy_submit: [b.p_operation, b.p_kind],
              app_privacy_withdraw: [b.p_operation, b.p_id, b.p_version],
              app_privacy_review: [b.p_operation, b.p_id, b.p_version, b.p_status, b.p_note],
              app_is_platform_admin: [],
            };
            if (name in args) data = await f.rpc(name, args[name]);
          }
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
      (s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)),
      session,
    );
    await page.goto('http://127.0.0.1:4187/more/' + (admin ? 'operations-admin' : 'operations'));
    return { page, context };
  }
  try {
    const own = await open(f.other);
    const page = own.page;
    await page
      .getByRole('heading', { name: 'Diagnóstico e privacidade', exact: true, level: 2 })
      .waitFor();
    await page.getByRole('button', { name: 'Baixar diagnóstico resumido' }).waitFor();
    const dlPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Baixar diagnóstico resumido' }).click();
    const dl = await dlPromise;
    const diagnostic = JSON.parse(await readFile(await dl.path(), 'utf8'));
    assert.equal(diagnostic.schema, 'meuagro-diagnostic-v1');
    assert.ok(!JSON.stringify(diagnostic).includes(f.other));
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Registrar solicitação' }).click();
    await page.getByRole('button', { name: 'Retirar solicitação' }).waitFor();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Retirar solicitação' }).click();
    await page.getByRole('heading', { name: /Exportação de dados • Retirada/ }).waitFor();
    await page.locator('#privacy-kind').selectOption('delete');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Registrar solicitação' }).click();
    await page.getByRole('heading', { name: 'Exclusão de dados • Aberta' }).waitFor();
    await page.screenshot({ path: '../work/operations-mobile.png', fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const admin = await open(f.user, true);
    const p = admin.page;
    await p.getByRole('button', { name: 'Atender solicitação', exact: true }).click();
    await p.locator('#privacy-answer').fill('Escopo em conferência pela administração.');
    await p.getByRole('checkbox').check();
    await p.getByRole('button', { name: 'Salvar atendimento' }).click();
    await p.getByRole('heading', { name: 'Exclusão de dados • Em atendimento' }).waitFor();
    await p.getByRole('button', { name: 'Atender solicitação', exact: true }).click();
    await p.locator('#privacy-answer').fill('Atendimento manual verificado no ambiente de teste.');
    await p.getByRole('checkbox').check();
    await p.getByRole('button', { name: 'Salvar atendimento' }).click();
    await p.getByRole('heading', { name: 'Exclusão de dados • Atendimento concluído' }).waitFor();
    await p.screenshot({ path: '../work/operations-admin-mobile.png', fullPage: true });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.bringToFront();
    await page.getByRole('button', { name: 'Atualizar diagnóstico' }).click();
    await page
      .getByRole('heading', { name: 'Exclusão de dados • Atendimento concluído' })
      .waitFor();
    await own.context.setOffline(true);
    await page
      .getByRole('button', { name: 'Baixar diagnóstico resumido' })
      .waitFor({ state: 'hidden' });
    await page.getByText(/Conecte-se para consultar/).waitFor();
    await own.context.setOffline(false);
    await page.getByRole('button', { name: 'Baixar diagnóstico resumido' }).waitFor();
    await page.goto('http://127.0.0.1:4187/more/operations-admin');
    await page.getByRole('alert').filter({ hasText: 'Acesso exclusivo' }).waitFor();
    assert.equal(await page.getByText(/Conta solicitante:/).count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: diagnóstico sem dados pessoais, solicitação/retirada, atendimento real em SQL, mobile, offline e bloqueio administrativo.',
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
    await queue;
    await f.db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

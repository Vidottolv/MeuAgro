const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { prioritiesFixture } = await import('../priorities-fixture.mjs');
  const f = await prioritiesFixture(),
    root = resolve(process.env.VISIT_TEST_DIST || 'dist');
  await f.db.exec('reset role');
  await f.db.exec(await readFile(resolve('supabase/stage_49_platform_admin.sql'), 'utf8'));
  await f.db.query('insert into app_platform_admins(user_id) values($1)', [f.user]);
  const user = {
    id: f.user,
    email: 'produtor@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    user_metadata: { full_name: 'Produtor Teste' },
  };
  const token =
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
    '.' +
    Buffer.from(
      JSON.stringify({
        sub: f.user,
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
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type':
          { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ||
          'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((done) => server.listen(4186, '127.0.0.1', done));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
    headless: true,
  });
  let queue = Promise.resolve();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const errors = [];
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        headers = {
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
        const body = req.postDataJSON();
        const canonical = {
          subscription: 'sub_browser',
          customer: 'cus_browser',
          expected_cents: 1000,
          environment: 'sandbox',
          cycle: 'MONTHLY',
        };
        if (body.action === 'admin-preview') data = canonical;
        else {
          const run = queue.then(async () => {
            await f.as('', 'service_role');
            return f.rpc('app_admin_link', [
              f.user,
              body.operation,
              {
                ...canonical,
                user_id: body.user_id,
                plan_code: body.plan_code,
                version: body.version,
                reason: body.reason,
              },
            ]);
          });
          queue = run.catch(() => {});
          try {
            data = await run;
          } catch (e) {
            status = 409;
            data = { error: e.message };
          }
        }
      } else if (url.pathname === '/functions/v1/weather-forecast') {
        data = {
          error:
            'Previsão ainda não ativada pelo administrador. O registro de chuva continua disponível.',
        };
        status = 503;
      } else if (url.pathname.includes('/rpc/')) {
        const name = url.pathname.split('/').at(-1);
        if (/^(budget_|procurement_|weather_|app_|onboarding_|receivable_|cash_flow_)/.test(name)) {
          const args = req.postDataJSON() || {},
            keys = Object.keys(args),
            run = queue.then(async () => {
              await f.as();
              return (
                await f.db.query(
                  'select public.' +
                    name +
                    '(' +
                    keys.map((key, i) => key + '=> $' + (i + 1)).join(',') +
                    ') r',
                  keys.map((k) =>
                    args[k] !== null && typeof args[k] === 'object'
                      ? JSON.stringify(args[k])
                      : args[k],
                  ),
                )
              ).rows[0].r;
            });
          queue = run.catch(() => {});
          try {
            data = await run;
          } catch (e) {
            data = { code: e.code || 'P0001', message: e.message };
            status = 400;
          }
        }
      }
      await route.fulfill({ status, headers, body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((session) => {
      localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
    }, session);

    await page.goto('http://127.0.0.1:4186/more/platform-admin');
    await page.getByRole('heading', { name: 'Catálogo comercial', exact: true }).waitFor();
    const catalog = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Catálogo comercial', exact: true }) });
    await catalog
      .locator('li')
      .filter({ hasText: 'Empresa — até 10 representantes' })
      .getByRole('button', { name: 'Editar', exact: true })
      .click();
    await page.getByLabel('Mensalidade em centavos', { exact: true }).fill('1000');
    await catalog.getByLabel('Motivo', { exact: true }).fill('Preço de teste administrativo');
    await page.getByLabel('Confirmo a alteração do catálogo.').check();
    await page.getByRole('button', { name: 'Salvar catálogo', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Registro confirmado.' }).waitFor();
    await page.getByLabel('E-mail (trecho) ou UUID', { exact: true }).fill(f.other);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir conta', exact: true }).click();
    await page.getByText('UUID: ' + f.other, { exact: true }).waitFor();
    await page.getByLabel('ID da assinatura', { exact: true }).fill('sub_browser');
    await page.getByRole('button', { name: 'Consultar no Asaas', exact: true }).click();
    await page
      .getByText('Assinatura: sub_browser • Cliente: cus_browser', { exact: true })
      .waitFor();
    await page
      .getByLabel('Motivo administrativo', { exact: true })
      .fill('Vínculo confirmado no provedor');
    await page
      .getByLabel('Conferi o titular, o plano, o ambiente e a alteração solicitada.')
      .check();
    await page.getByRole('button', { name: 'Confirmar vínculo', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Vínculo salvo.' }).waitFor();
    await page
      .getByText('Assinatura: sub_browser • Cliente: cus_browser', { exact: true })
      .first()
      .waitFor();
    await page
      .getByLabel('Fim do teste (horário local)', { exact: true })
      .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await page
      .getByLabel('Conferi o titular, o plano, o ambiente e a alteração solicitada.')
      .check();
    await page.getByRole('button', { name: 'Conceder teste', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Registro confirmado.' }).waitFor();
    await page
      .getByRole('button', { name: 'Remover concessão manual', exact: true })
      .waitFor({ state: 'visible' });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/admin-mobile.png', fullPage: true });
    await context.setOffline(true);
    await page
      .getByText('Conecte-se para administrar. Não há edição offline.', { exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole('heading', { name: 'Catálogo comercial', exact: true }).count(),
      0,
    );
    await context.setOffline(false);
    await page.getByRole('heading', { name: 'Catálogo comercial', exact: true }).waitFor();
    await queue;
    await f.db.exec('reset role');
    await f.db.query('update app_platform_admins set active=false where user_id=$1', [f.user]);
    await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Acesso exclusivo' }).waitFor();
    assert.equal(
      await page.getByRole('heading', { name: 'Catálogo comercial', exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS: catálogo, busca, vínculo, teste manual, mobile, offline e revogação contra PostgreSQL local; Asaas simulado.',
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

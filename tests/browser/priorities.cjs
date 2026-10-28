const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const { prioritiesFixture } = await import('../priorities-fixture.mjs');
  const f = await prioritiesFixture(),
    root = resolve(process.env.VISIT_TEST_DIST || 'dist');
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
      else if (url.pathname === '/functions/v1/weather-forecast') {
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
    await page.goto('http://127.0.0.1:4186/more/budgets');
    await page.getByRole('button', { name: 'Novo orçamento', exact: true }).click();
    await page.locator('#budget-cycle').selectOption(f.cycle);
    await page.locator('#budget-name').fill('Plano da safra');
    await page.getByRole('button', { name: 'Adicionar operação', exact: true }).click();
    await page.locator('#budget-input-0').selectOption(f.input);
    await page.locator('#budget-label-0').fill('Semear o talhão');
    await page.locator('#budget-qty-0').fill('30');
    await page.locator('#budget-price-0').fill('1,00');
    await page.getByRole('button', { name: 'Salvar orçamento', exact: true }).click();
    await page.getByRole('heading', { name: 'Plano da safra', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Aprovar orçamento', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar a rascunho', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Comparar com realizado', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Previsto × realizado — Plano da safra', exact: true })
      .waitFor();
    await page.goto('http://127.0.0.1:4186/more/procurement');
    await page.getByRole('heading', { name: 'Semente', exact: true }).waitFor();
    await page.getByText('37 kg', { exact: true }).waitFor();
    const stockCSV = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar reposição desta página (CSV)', exact: true })
      .click();
    assert.match(await readFile(await (await stockCSV).path(), 'utf8'), /"30";"0";"37"/);
    await page.goto('http://127.0.0.1:4186/more/weather');
    await page.locator('#weather-property').selectOption(f.property);
    await page.locator('#weather-lat').fill('-23,55');
    await page.locator('#weather-lon').fill('-46,63');
    await page.getByRole('button', { name: 'Salvar ponto meteorológico', exact: true }).click();
    const forecast = page.getByRole('button', {
      name: 'Consultar previsão de sete dias',
      exact: true,
    });
    await forecast.waitFor();
    await forecast.click();
    await page.getByRole('alert').filter({ hasText: 'Previsão ainda não ativada' }).waitFor();
    await page.locator('#rain-mm').fill('12,5');
    await page.locator('#rain-note').fill('Medição do pluviômetro');
    await page.getByRole('button', { name: 'Salvar leitura de chuva', exact: true }).click();
    await page.getByRole('button', { name: 'Anular leitura', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Anular leitura', exact: true }).click();
    await page.locator('#rain-void').fill('Leitura incorreta');
    await page.getByRole('button', { name: 'Confirmar anulação', exact: true }).click();
    await page.getByText('Anulada: Leitura incorreta', { exact: true }).waitFor();
    await page.goto('http://127.0.0.1:4186/more/account-plan');
    await page.getByRole('heading', { name: 'Primeiros passos', exact: true }).waitFor();
    await page
      .locator('#onboarding-csv')
      .setInputFiles({
        name: 'insumos.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
          'name;brand;category;base_unit;minimum_stock;ideal_stock\r\nSemente importada;Marca;seeds;kg;1;3\r\n',
        ),
      });
    await page.getByRole('heading', { name: 'Prévia — 1 insumos', exact: true }).waitFor();
    await page
      .getByRole('checkbox', {
        name: 'Revisei os cadastros e confirmo a importação sem saldo inicial',
        exact: true,
      })
      .check();
    await page
      .getByRole('button', { name: 'Confirmar importação dos insumos', exact: true })
      .click();
    await page
      .getByText('1 insumos importados. Nenhum saldo inicial foi criado.', { exact: true })
      .waitFor();
    await page.locator('#account-plan').selectOption('company10');
    await page.getByRole('button', { name: 'Registrar interesse no plano', exact: true }).click();
    await page
      .getByText('Solicitação registrada. Isso não contrata nem cobra um plano.', { exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/priorities-account-mobile.png', fullPage: true });
    await page.goto('http://127.0.0.1:4186/more/receivables');
    await page.getByRole('button', { name: 'Nova conta a receber', exact: true }).click();
    await page.locator('#expense-property').selectOption(f.property);
    await page.locator('#expense-title').fill('Serviço prestado');
    await page.locator('#expense-amount').fill('100,01');
    await page.getByRole('button', { name: 'Salvar conta a receber', exact: true }).click();
    const detail = page.getByRole('region', { name: 'Detalhe da conta a receber', exact: true });
    await detail.waitFor();
    await detail.getByRole('button', { name: 'Registrar recebimento', exact: true }).click();
    await page.locator('#expense-payment-amount').fill('33,33');
    await detail.getByRole('button', { name: 'Confirmar registro', exact: true }).click();
    await detail.getByText(/Saldo: R\$.*66,68/).waitFor();
    await page.goto('http://127.0.0.1:4186/more/cashflow');
    await page.getByText('Entradas: R$ 33,33', { exact: true }).waitFor();
    await context.setOffline(true);
    await page
      .getByText('Conecte-se para consultar o fluxo registrado.', { exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole('heading', { name: 'Movimentações confirmadas no período', exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS: budgets, procurement CSV, weather/rain, CSV onboarding, plans, receivables, cash flow and mobile/offline behavior against local PostgreSQL',
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

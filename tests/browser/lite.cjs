const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile, mkdir } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = resolve(process.env.LITE_TEST_DIST || '../work/lite-build'),
    qa = resolve('../work/lite-qa');
  await mkdir(qa, { recursive: true });
  const server = createServer(async (req, res) => {
    try {
      let p = new URL(req.url, 'http://localhost').pathname;
      if (!extname(p)) p = '/index.html';
      const file = resolve(root, '.' + p);
      if (!file.startsWith(root + sep)) throw Error();
      res.writeHead(200, {
        'content-type':
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.webmanifest': 'application/manifest+json',
          }[extname(file)] || 'application/octet-stream',
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((done) => server.listen(4198, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'block',
    });
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'lite@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { full_name: 'Consultora Ana' },
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
    await context.addInitScript(
      (s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)),
      session,
    );
    let active = true,
      sales = [],
      lastSave = null,
      received = 0;
    const access = () => ({ mode: 'lite', active, protected: true });
    const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(
        new Date(),
      ),
      month = now.slice(0, 7) + '-01';
    const months = Array.from({ length: 23 }, (_, i) => {
      const d = new Date(month + 'T12:00:00Z');
      d.setUTCMonth(d.getUTCMonth() + i - 11);
      return {
        month: d.toISOString().slice(0, 10),
        expected: i === 11 ? 10000 - received : 0,
        received: i === 11 ? received : 0,
      };
    });
    const errors = [];
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const path = new URL(route.request().url()).pathname,
        body = route.request().postDataJSON() || {};
      let result = [];
      if (path === '/auth/v1/user') result = user;
      else if (path === '/auth/v1/token') result = session;
      else if (path.endsWith('/app_lite_access')) result = access();
      else if (path.endsWith('/app_lite_context'))
        result = {
          access: access(),
          month,
          summary: { count: sales.length, sales: 200000, earned: 10000 },
          received,
          overdue: 0,
          months: months.map((m) => ({
            ...m,
            received: m.month === month ? received : m.received,
            expected: m.month === month ? 10000 - received : m.expected,
          })),
          count: sales.length,
          sales,
        };
      else if (path.endsWith('/app_lite_command')) {
        if (body.p_action === 'save') {
          lastSave = body.p_data;
          const d = lastSave;
          sales = [
            {
              ...d,
              items: d.items.map((i) => ({
                ...i,
                total_cents: Math.round(i.quantity * i.unit_price_cents),
              })),
              id: crypto.randomUUID(),
              version: 1,
              total_cents: 200000,
              commission_cents: 10000,
              installments: d.dates.map((due_on, j) => ({
                id: '22222222-2222-4222-8222-222222222222',
                number: j + 1,
                due_on,
                sale_cents: 200000,
                commission_cents: 10000,
                paid: 0,
                receipts: [],
              })),
            },
          ];
          result = { id: sales[0].id };
        } else if (body.p_action === 'receive') {
          received = body.p_data.amount_cents;
          sales[0].installments[0].paid = received;
          result = { id: 'receipt-test' };
        }
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(result),
      });
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4198/dashboard');
    await page.waitForURL('**/consultor/lite');
    await page.getByRole('heading', { name: 'Vendas no mês', exact: true }).waitFor();
    assert.equal(
      await page.getByRole('button', { name: /Ir para produtor|Ir para consultor/ }).count(),
      0,
    );
    assert.equal(await page.locator('.bottom-nav__item').count(), 0);
    await page.getByRole('link', { name: 'Vendas', exact: true }).click();
    await page.getByRole('button', { name: 'Nova venda', exact: true }).click();
    await page.getByLabel('Nome do produtor').fill('Sítio Boa Esperança');
    await page.getByLabel('Produto', { exact: true }).fill('Fertilizante');
    await page.getByLabel('Quantidade', { exact: true }).fill('10');
    await page.getByLabel('Valor unitário (R$)').fill('200,00');
    await page.getByLabel('Percentual (%)').fill('5');
    await page.getByRole('button', { name: 'Salvar venda', exact: true }).click();
    await page.getByRole('heading', { name: 'Sítio Boa Esperança', exact: true }).waitFor();
    assert.equal(lastSave.commission_rate, 500);
    assert.equal(lastSave.items[0].unit_price_cents, 20000);
    await page.getByText('Parcelas e recebimentos de comissão', { exact: true }).click();
    await page.getByRole('button', { name: 'Registrar recebimento da comissão' }).click();
    await page.getByLabel('Valor recebido (R$)').fill('50,00');
    await page.getByRole('button', { name: 'Confirmar recebimento', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Registro confirmado.' }).waitFor();
    assert.equal(received, 5000);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.screenshot({ path: resolve(qa, `vendas-${width}.png`), fullPage: true });
    }
    await page.getByRole('link', { name: 'Comissões', exact: true }).click();
    await page.getByRole('heading', { name: 'Previsão de recebimentos' }).waitFor();
    await page.screenshot({ path: resolve(qa, 'comissoes.png'), fullPage: true });
    await page.goto('http://127.0.0.1:4198/properties');
    await page.waitForURL('**/consultor/lite');
    active = false;
    await page.goto('http://127.0.0.1:4198/consultor/lite/vendas');
    await page.getByText(/O plano está sem vigência/).waitFor();
    assert.equal(
      await page.getByRole('button', { name: 'Nova venda', exact: true }).isDisabled(),
      true,
    );
    await context.setOffline(true);
    await page.getByRole('link', { name: 'Comissões', exact: true }).click();
    await page.getByText(/Conecte-se para consultar seus registros Lite/).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      'Lite: navegação restrita, cadastro, recebimento, vencimento, modo offline e telas 320/390/1280 sem overflow.',
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

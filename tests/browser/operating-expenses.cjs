const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(process.env.VISIT_TEST_DIST || 'dist');
const uid = '11111111-1111-4111-8111-111111111111',
  pid = '22222222-2222-4222-8222-222222222222',
  aid = '33333333-3333-4333-8333-333333333333',
  cid = '44444444-4444-4444-8444-444444444444',
  cropid = '55555555-5555-4555-8555-555555555555';
const property = {
  id: pid,
  user_id: uid,
  name: 'Sítio Horizonte',
  status: 'active',
  deleted_at: null,
};
const area = {
  id: aid,
  user_id: uid,
  property_id: pid,
  name: 'Talhão Norte',
  deleted_at: null,
  status: 'active',
};
const crop = { id: cropid, name: 'Milho', is_system: true, active: true };
const cycle = {
  id: cid,
  user_id: uid,
  property_id: pid,
  area_id: aid,
  crop_id: cropid,
  property,
  area,
  crop,
  status: 'planted',
  deleted_at: null,
  planting_date: '2026-10-01',
};
const user = {
  id: uid,
  email: 'tecnico@example.test',
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: { full_name: 'Técnico Teste' },
};
const token =
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
  '.' +
  Buffer.from(
    JSON.stringify({ sub: uid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }),
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
const expenses = [],
  payments = [],
  operations = new Map(),
  errors = [];
let losePayment = true;
const server = createServer(async (req, res) => {
  try {
    let p = new URL(req.url, 'http://localhost').pathname;
    if (!extname(p)) p = '/index.html';
    const file = resolve(root, '.' + p);
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
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
(async () => {
  await new Promise((done) => server.listen(4184, '127.0.0.1', done));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
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
      let data = [];
      if (url.pathname === '/auth/v1/user') data = user;
      else if (url.pathname === '/auth/v1/token') data = session;
      else if (url.pathname.endsWith('/rpc/expense_context'))
        data = {
          properties: [property],
          seasons: [{ id: cid, name: 'Safra teste', property_id: pid }],
        };
      else if (url.pathname.endsWith('/rpc/expense_list')) {
        const f = req.postDataJSON();
        let rows = expenses.map((e) => {
          const paid = payments
            .filter((p) => p.expense_id === e.id && !p.reversed_at)
            .reduce((a, p) => a + p.amount_cents, 0);
          return {
            ...e,
            paid_cents: paid,
            balance_cents: e.cancelled_at ? 0 : e.amount_cents - paid,
          };
        });
        rows = rows.filter(
          (e) =>
            (f.p_state === 'cancelled' ? e.cancelled_at : !e.cancelled_at) &&
            (f.p_state !== 'open' || e.balance_cents > 0) &&
            (f.p_state !== 'paid' || e.balance_cents === 0) &&
            (!f.p_property || e.property_id === f.p_property) &&
            (!f.p_from || e.due_date >= f.p_from) &&
            (!f.p_to || e.due_date <= f.p_to),
        );
        data = {
          items: rows.slice(f.p_offset, f.p_offset + 50),
          count: rows.length,
          totals: {
            amount_cents: rows
              .filter((e) => !e.cancelled_at)
              .reduce((a, e) => a + e.amount_cents, 0),
            paid_cents: rows.reduce((a, e) => a + e.paid_cents, 0),
            balance_cents: rows
              .filter((e) => !e.cancelled_at)
              .reduce((a, e) => a + e.balance_cents, 0),
          },
        };
      } else if (url.pathname.endsWith('/rpc/expense_detail')) {
        const id = req.postDataJSON().p_id;
        data = {
          expense: expenses.find((e) => e.id === id),
          payments: payments.filter((p) => p.expense_id === id),
        };
      } else if (url.pathname.endsWith('/rpc/expense_command')) {
        const b = req.postDataJSON(),
          d = b.p_data;
        if (operations.has(b.p_operation)) {
          assert.deepEqual(operations.get(b.p_operation).body, b);
          data = operations.get(b.p_operation).result;
        } else {
          let e;
          if (b.p_action === 'create') {
            e = {
              ...d,
              id: b.p_operation,
              version: 1,
              property_name: property.name,
              season_name: 'Safra teste',
            };
            expenses.push(e);
          } else {
            e = expenses.find((e) => e.id === d.id);
            assert.equal(e.version, d.version);
            if (b.p_action === 'pay')
              payments.push({
                id: b.p_operation,
                expense_id: e.id,
                amount_cents: d.amount_cents,
                paid_on: d.paid_on,
                note: d.note,
              });
            if (b.p_action === 'reverse')
              Object.assign(
                payments.find((p) => p.id === d.payment_id),
                { reversed_at: new Date().toISOString(), reverse_reason: d.reason },
              );
            if (b.p_action === 'cancel')
              Object.assign(e, { cancelled_at: new Date().toISOString(), cancel_reason: d.reason });
            e.version++;
          }
          data = { id: e.id, version: e.version };
          operations.set(b.p_operation, { body: b, result: data });
          if (b.p_action === 'pay' && losePayment) {
            losePayment = false;
            return route.fulfill({
              status: 400,
              headers,
              body: JSON.stringify({
                code: '57014',
                message: 'Resposta indisponível. Tente novamente.',
              }),
            });
          }
        }
      }
      return route.fulfill({ status: 200, headers, body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((session) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
        sessionStorage.setItem('seeded', '1');
      }
    }, session);
    await page.goto('http://127.0.0.1:4184/more/expenses');
    await page.getByRole('button', { name: 'Nova despesa', exact: true }).click();
    await page.locator('#expense-property').selectOption(pid);
    await page.locator('#expense-season').selectOption(cid);
    await page.locator('#expense-title').fill('Frete da safra');
    await page.locator('#expense-category').selectOption('freight');
    await page.locator('#expense-amount').fill('100,01');
    await page.locator('#expense-due').fill('2027-01-06');
    await page.getByRole('button', { name: 'Salvar despesa', exact: true }).click();
    const detail = page.getByRole('region', { name: 'Detalhe da despesa', exact: true });
    await detail.waitFor();
    assert.equal(expenses.length, 1);
    assert.equal(expenses[0].amount_cents, 10001);
    await detail.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
    await page.locator('#expense-payment-amount').fill('33,33');
    await detail.getByRole('button', { name: 'Confirmar registro', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Resposta indisponível' }).waitFor();
    assert.equal(await page.locator('#expense-payment-amount').inputValue(), '33,33');
    await detail.getByRole('button', { name: 'Confirmar registro', exact: true }).click();
    await detail.getByText(/Saldo: R\$.*66,68/).waitFor();
    assert.equal(payments.length, 1);
    const csv = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar esta página (CSV)', exact: true }).click();
    assert.match(await readFile(await (await csv).path(), 'utf8'), /"100,01";"33,33";"66,68"/);
    await detail.getByRole('button', { name: 'Estornar pagamento', exact: true }).click();
    await page.locator('#expense-action-reason').fill('Lançamento duplicado');
    await detail.getByRole('button', { name: 'Confirmar registro', exact: true }).click();
    await detail.getByText('Estornado: Lançamento duplicado', { exact: true }).waitFor();
    assert.ok(payments[0].reversed_at);
    await detail.getByRole('button', { name: 'Cancelar despesa', exact: true }).click();
    await page.locator('#expense-action-reason').fill('Serviço não realizado');
    await detail.getByRole('button', { name: 'Confirmar registro', exact: true }).click();
    await detail.getByText('Cancelada: Serviço não realizado', { exact: true }).waitFor();
    await page.locator('#expense-state').selectOption('cancelled');
    await page.getByRole('button', { name: 'Aplicar filtros / atualizar', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir despesa', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/operating-expenses-mobile.png', fullPage: true });
    await context.setOffline(true);
    await page
      .getByText(
        'Conecte-se para consultar e registrar despesas. Este módulo não possui fila offline.',
        { exact: true },
      )
      .waitFor();
    assert.equal(await page.getByRole('button', { name: 'Abrir despesa', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: expense creation, partial payment, lost-response retry, reversal, cancellation, CSV, mobile layout and offline clearing',
    );
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});

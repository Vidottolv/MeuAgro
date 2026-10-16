const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(process.env.SHARING_TEST_DIST || 'dist');
const owner = '11111111-1111-4111-8111-111111111111',
  consultant = '22222222-2222-4222-8222-222222222222';
const pid = '33333333-3333-4333-8333-333333333333',
  vid = '44444444-4444-4444-8444-444444444444';
const property = {
  id: pid,
  user_id: owner,
  name: 'Sítio Compartilhado',
  status: 'active',
  deleted_at: null,
};
let share = null,
  sharedReport = false;
const visit = {
  id: vid,
  author_id: consultant,
  producer_name: 'Produtor Teste',
  site_name: property.name,
  technician_name: 'Consultor Teste',
  visited_at: '2026-10-16T12:00:00Z',
  priority: 'medium',
  anamnesis: { reason: 'Vistoria técnica autorizada' },
};
const detail = () => ({
  property,
  areas: [{ id: 'area', name: 'Talhão Norte' }],
  cycles: [],
  events: [
    {
      id: 'event',
      title: 'Vistoria',
      occurred_at: visit.visited_at,
      description: 'MARCADOR-TECNICO-SEM-CACHE',
    },
  ],
  reports: sharedReport ? [visit] : [],
  audit: [],
});
const server = createServer(async (req, res) => {
  try {
    let path = new URL(req.url, 'http://localhost').pathname;
    if (!extname(path)) path = '/index.html';
    const file = resolve(root, '.' + decodeURIComponent(path));
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
const errors = [];
(async () => {
  await new Promise((done) => server.listen(4185, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  async function actor(id) {
    const user = {
      id,
      email: id === owner ? 'produtor@example.test' : 'consultor@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { full_name: 'Teste' },
    };
    const token =
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
      '.' +
      Buffer.from(
        JSON.stringify({
          sub: id,
          role: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url') +
      '.test';
    const session = {
      user,
      access_token: token,
      refresh_token: 'refresh-test',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
    };
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname;
      const headers = {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      };
      let data = [],
        status = 200;
      if (req.method() === 'OPTIONS') return route.fulfill({ status, headers, body: '{}' });
      if (path === '/auth/v1/user') data = user;
      else if (path === '/auth/v1/token') data = session;
      else if (path.endsWith('/rpc/property_share_list')) data = share ? [share] : [];
      else if (path.endsWith('/rpc/property_share_detail')) {
        if (share?.status === 'active') data = detail();
        else {
          status = 403;
          data = { code: '42501', message: 'Acesso revogado.' };
        }
      } else if (path.endsWith('/rpc/property_share_command')) {
        const { p_action } = req.postDataJSON();
        if (p_action === 'invite')
          share = {
            id: '55555555-5555-4555-8555-555555555555',
            property_id: pid,
            property_name: property.name,
            owner_id: owner,
            owner_name: 'Produtor Teste',
            invite_email: 'consultor@example.test',
            consultant_id: null,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
            created_at: new Date().toISOString(),
            audit: [],
          };
        if (p_action === 'accept') {
          share.status = 'active';
          share.consultant_id = consultant;
        }
        if (p_action === 'share_report') sharedReport = true;
        if (p_action === 'unshare_report') sharedReport = false;
        if (p_action === 'revoke') share.status = 'revoked';
        data = { id: share.id, status: share.status };
      } else if (path.endsWith('/properties')) data = id === owner ? [property] : [];
      else if (path.endsWith('/technical_visits')) data = id === consultant ? [visit] : [];
      await route.fulfill({ status, headers, body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((session) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
        sessionStorage.setItem('seeded', '1');
      }
    }, session);
    await page.bringToFront();
    await page.goto('http://127.0.0.1:4185/more/sharing');
    await page
      .getByRole('heading', { name: 'Compartilhamento técnico', level: 2, exact: true })
      .waitFor();
    return { page, context };
  }
  try {
    const producer = await actor(owner);
    await producer.page.getByLabel('Propriedade', { exact: true }).selectOption(pid);
    await producer.page.getByLabel('E-mail da conta do consultor').fill('consultor@example.test');
    await producer.page.getByRole('button', { name: 'Criar convite', exact: true }).click();
    await producer.page.getByText('Aguardando aceite', { exact: true }).waitFor();
    const professional = await actor(consultant),
      page = professional.page;
    await page.getByRole('button', { name: 'Aceitar convite', exact: true }).click();
    await page.getByRole('button', { name: 'Consultar acompanhamento', exact: true }).click();
    await page.getByText('MARCADOR-TECNICO-SEM-CACHE', { exact: true }).waitFor();
    await page.getByLabel('Ficha', { exact: true }).selectOption(vid);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Compartilhar ficha selecionada', exact: true }).click();
    await page
      .getByRole('button', { name: 'Visualizar ficha compartilhada', exact: true })
      .waitFor();
    await producer.page.bringToFront();
    await producer.page.getByRole('button', { name: 'Atualizar permissões', exact: true }).click();
    await producer.page
      .getByRole('button', { name: 'Consultar acompanhamento', exact: true })
      .click();
    await producer.page
      .getByRole('button', { name: 'Visualizar ficha compartilhada', exact: true })
      .click();
    const report = producer.page.getByRole('dialog');
    await report
      .getByText('Fotos não incluídas neste compartilhamento.', { exact: true })
      .waitFor();
    await report.getByRole('button', { name: 'Fechar relatório', exact: true }).click();
    console.log('PASS: producer invites, consultant accepts and explicitly shares a report');
    await page.bringToFront();
    await page.getByRole('button', { name: 'Consultar acompanhamento', exact: true }).click();
    await page.getByText('MARCADOR-TECNICO-SEM-CACHE', { exact: true }).waitFor();
    await page.screenshot({ path: '../work/property-sharing.png', fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await professional.context.setOffline(true);
    await page
      .getByText('Conecte-se para consultar ou alterar compartilhamentos.', { exact: true })
      .waitFor();
    assert.equal(await page.getByText('MARCADOR-TECNICO-SEM-CACHE', { exact: true }).count(), 0);
    const persisted = await page.evaluate(async () => {
      const values = [];
      for (const { name } of await indexedDB.databases()) {
        const db = await new Promise((resolve, reject) => {
          const r = indexedDB.open(name);
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        for (const store of db.objectStoreNames)
          values.push(
            ...(await new Promise((resolve, reject) => {
              const r = db.transaction(store).objectStore(store).getAll();
              r.onsuccess = () => resolve(r.result);
              r.onerror = () => reject(r.error);
            })),
          );
        db.close();
      }
      return JSON.stringify(values);
    });
    assert.ok(!persisted.includes('MARCADOR-TECNICO-SEM-CACHE'));
    console.log('PASS: offline clears shared content and RPC data is absent from IndexedDB');
    await producer.page
      .getByRole('button', { name: 'Revogar acesso / cancelar convite', exact: true })
      .click();
    await producer.page.getByText('Revogado', { exact: true }).waitFor();
    await professional.context.setOffline(false);
    await page.getByText('Revogado', { exact: true }).waitFor();
    assert.equal(
      await page.getByRole('button', { name: 'Consultar acompanhamento', exact: true }).count(),
      0,
    );
    assert.equal(await page.getByText('MARCADOR-TECNICO-SEM-CACHE', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: revoked access stays blocked on reconnect; no browser errors');
    await producer.context.close();
    await professional.context.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

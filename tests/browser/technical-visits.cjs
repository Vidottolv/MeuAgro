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
const visits = [],
  photos = [],
  committed = new Map(),
  errors = [];
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
      else if (url.pathname.endsWith('/rpc/sync_visit_operation')) {
        const body = req.postDataJSON(),
          p = body.p_payload;
        if (!committed.has(body.p_operation)) {
          committed.set(body.p_operation, p);
          if (p.visit) visits.push(p.visit);
          if (p.photos) photos.push(...p.photos);
          if (p.kind === 'visit_photo') photos.push(p.photo);
        }
        data = { id: body.p_operation, synced: true };
      } else if (url.pathname.startsWith('/storage/v1/object/')) data = { Key: 'uploaded' };
      else {
        const table = url.pathname.split('/').at(-1);
        data =
          {
            properties: [property],
            areas: [area],
            crops: [crop],
            production_cycles: [cycle],
            technical_visits: visits,
            technical_visit_photos: photos,
          }[table] || [];
        for (const field of ['id', 'visit_id', 'author_id'])
          if (url.searchParams.get(field)?.startsWith('eq.'))
            data = data.filter((row) => row[field] === url.searchParams.get(field).slice(3));
        if (req.method() === 'HEAD') {
          headers['content-range'] = '*/' + data.length;
          data = null;
        }
      }
      await route.fulfill({
        status: 200,
        headers,
        body: data === null ? '' : JSON.stringify(data),
      });
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
    await page.goto('http://127.0.0.1:4184/more/settings');
    await page.getByRole('heading', { name: 'Uso offline e sincronização' }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
    await page.getByRole('button', { name: 'Preparar dados de campo', exact: true }).click();
    await page.getByText('Dados de campo preparados neste dispositivo.', { exact: true }).waitFor();
    console.log(
      'PASS: offline preparation includes personal visit history and required field context',
    );
    await context.setOffline(true);
    await page.goto('http://127.0.0.1:4184/more/visits?new=1');
    await page.locator('#visit-producer').fill('Produtor João');
    await page.locator('#visit-property').selectOption(pid);
    await page.locator('#visit-area option[value="' + aid + '"]').waitFor({ state: 'attached' });
    await page.locator('#visit-area').selectOption(aid);
    await page.locator('#visit-crop').selectOption(cropid);
    await page.locator('#visit-cycle').selectOption(cid);
    await page.locator('#visit-reason').fill('Manchas nas folhas do milho');
    await page
      .locator('#visit-producer_report')
      .fill('O produtor observou o problema há três dias.');
    await page.locator('#visit-symptoms').fill('Lesões nas folhas do talhão norte.');
    await page.locator('#visit-next').fill('2027-01-06');
    await page
      .locator('#visit-recommendations')
      .fill('Coleta de amostras e acompanhamento combinado.');
    await page.locator('input[type=file]').setInputFiles({
      name: 'folha.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6bW8AAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await page.getByLabel('Legenda da foto 1', { exact: true }).fill('Folha com manchas');
    await page.getByRole('button', { name: 'Registrar anamnese', exact: true }).click();
    await page.getByRole('heading', { name: 'Ficha de visita técnica', exact: true }).waitFor();
    await page.getByText('Salva neste dispositivo • aguardando envio', { exact: true }).waitFor();
    await page.getByRole('img', { name: 'Folha com manchas', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.reload();
    await page.getByText('Manchas nas folhas do milho', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Visualizar relatório', exact: true }).click();
    const report = page.getByRole('dialog', { name: 'MeuAgro — Relatório de visita técnica' });
    await report.waitFor();
    await report.getByText('Produtor João', { exact: true }).waitFor();
    await report
      .getByText('Pendente de sincronização — salvo neste dispositivo.', { exact: true })
      .waitFor();
    assert.equal(await report.getByRole('img', { name: 'Folha com manchas' }).count(), 1);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.visit-report-actions').isVisible(), false);
    assert.equal(await report.getByRole('heading', { level: 1 }).isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await report.getByRole('button', { name: 'Fechar relatório', exact: true }).focus();
    await page.keyboard.press('Escape');
    await report.waitFor({ state: 'detached' });
    assert.equal(
      await page
        .getByRole('button', { name: 'Visualizar relatório', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    const calendarDownload = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar retorno para calendário', exact: true })
      .click();
    const calendar = await calendarDownload;
    assert.equal(calendar.suggestedFilename(), 'meuagro-retorno.ics');
    assert.match(await readFile(await calendar.path(), 'utf8'), /DTSTART;VALUE=DATE:20270106/);
    console.log('PASS: offline report, photo, print layout, focus restoration and calendar export');
    await page.getByRole('img', { name: 'Folha com manchas', exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole('img', { name: 'Folha com manchas', exact: true })
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    await page.screenshot({
      path: process.env.VISIT_TEST_SCREENSHOT || '../work/visit-anamnesis.png',
      fullPage: true,
    });
    console.log(
      'PASS: structured anamnesis, agricultural links and photo survive a full offline reload',
    );
    await context.setOffline(false);
    await page.goto('http://127.0.0.1:4184/more/settings#offline');
    let status = '';
    for (let i = 0; i < 120; i++) {
      status = await page.locator('#offline').textContent();
      if (committed.size === 1 && /\b0\s+registro\(s\)\s+aguardando\s+envio\./.test(status)) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.equal(committed.size, 1);
    assert.match(status, /\b0\s+registro\(s\)\s+aguardando\s+envio\./);
    assert.equal(visits.length, 1);
    assert.equal(photos.length, 1);
    assert.equal(visits[0].production_cycle_id, cid);
    assert.equal(visits[0].anamnesis.symptoms, 'Lesões nas folhas do talhão norte.');
    console.log('PASS: reconnect synchronizes one visit with one photo without duplication');
    await page.goto('http://127.0.0.1:4184/more/visits');
    await page.locator('#visit-search').fill('TALHAO NORTE');
    await page.getByRole('link', { name: 'Abrir anamnese', exact: true }).waitFor();
    await page.locator('#visit-return-filter').selectOption('none');
    assert.equal(await page.getByRole('link', { name: 'Abrir anamnese', exact: true }).count(), 0);
    await page.locator('#visit-return-filter').selectOption('');
    const csvDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar lista filtrada (CSV)', exact: true }).click();
    const csv = await csvDownload;
    assert.match(await readFile(await csv.path(), 'utf8'), /Produtor João/);
    console.log('PASS: return filter and CSV export follow the loaded history');
    assert.deepEqual(errors, []);
    console.log('PASS: searchable visit history and no uncaught browser errors');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(process.env.OFFLINE_TEST_DIST || 'dist');
const userId = '11111111-1111-4111-8111-111111111111';
const propertyId = '22222222-2222-4222-8222-222222222222';
const areaId = '33333333-3333-4333-8333-333333333333';
const cycleId = '44444444-4444-4444-8444-444444444444';
const now = new Date().toISOString();
const user = {
  id: userId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'offline@example.test',
  user_metadata: { full_name: 'Teste de campo' },
  app_metadata: {},
  created_at: now,
};
const token =
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
  '.' +
  Buffer.from(
    JSON.stringify({
      sub: userId,
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url') +
  '.test';
const session = {
  user,
  access_token: token,
  refresh_token: 'test-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};
const property = {
  id: propertyId,
  user_id: userId,
  name: 'Sítio Teste',
  city: 'Londrina',
  state: 'PR',
  status: 'active',
  deleted_at: null,
};
const area = {
  id: areaId,
  property_id: propertyId,
  user_id: userId,
  name: 'Talhão 1',
  status: 'active',
  deleted_at: null,
  area_type: { name: 'Talhão' },
};
const crop = {
  id: '55555555-5555-4555-8555-555555555555',
  name: 'Soja',
  active: true,
  is_system: true,
};
const cycle = {
  id: cycleId,
  user_id: userId,
  property_id: propertyId,
  area_id: areaId,
  crop_id: crop.id,
  property,
  area,
  crop,
  season: null,
  status: 'planted',
  deleted_at: null,
  planting_date: '2026-10-01',
  variety: 'Teste',
  created_at: now,
  updated_at: now,
};
const committed = new Map(),
  storedPhotos = [],
  events = [],
  errors = [];
const server = createServer(async (req, res) => {
  try {
    let path = new URL(req.url, 'http://localhost').pathname;
    if (!extname(path)) path = '/index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const body = await readFile(file);
    const mime =
      { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ||
      'application/octet-stream';
    res.writeHead(200, { 'content-type': mime, 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
(async () => {
  await new Promise((r) => server.listen(4178, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
        'content-type': 'application/json',
      };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers, body: '{}' });
      let data = [];
      if (url.pathname === '/auth/v1/user') data = user;
      else if (url.pathname === '/auth/v1/token') data = session;
      else if (url.pathname.endsWith('/rpc/sync_field_operation')) {
        const body = req.postDataJSON();
        if (!committed.has(body.p_operation)) {
          committed.set(body.p_operation, body.p_payload);
          if (body.p_payload.event)
            events.push({ ...body.p_payload.event, event_photos: [], event_inputs: [] });
          if (body.p_payload.photo) storedPhotos.push(body.p_payload.photo);
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
            production_events: events,
            event_photos: storedPhotos,
            profiles: [{ id: userId, full_name: 'Teste de campo' }],
          }[table] || [];
        if (url.searchParams.get('id')?.startsWith('eq.'))
          data = data.filter((row) => row.id === url.searchParams.get('id').slice(3));
        if (req.headers().accept?.includes('object+json')) data = data[0] || null;
        if (req.method() === 'HEAD') {
          headers['content-range'] = '*/' + data.length;
          data = null;
        }
      }
      await route.fulfill({
        status: 200,
        headers,
        body: data === null && req.method() === 'HEAD' ? '' : JSON.stringify(data),
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ session }) => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
          sessionStorage.setItem('seeded', '1');
        }
      },
      { session },
    );
    await page.goto('http://127.0.0.1:4178/more/settings');
    await page.getByRole('heading', { name: 'Uso offline e sincronização' }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
    await page.getByRole('button', { name: 'Preparar dados de campo' }).click();
    await page
      .getByText('Dados de campo preparados neste dispositivo.', { exact: true })
      .waitFor({ timeout: 30000 });
    console.log('PASS: online preparation and service worker installation');
    await context.setOffline(true);
    await page.goto(`http://127.0.0.1:4178/plantings/${cycleId}/events/new`);
    await page.getByLabel('Título *', { exact: true }).fill('Praga registrada offline');
    await page.getByLabel('Descrição', { exact: true }).fill('Lagartas no talhão 1');
    await page.getByRole('button', { name: 'Registrar evento', exact: true }).click();
    await page.getByRole('heading', { name: 'Praga registrada offline', exact: true }).waitFor();
    console.log('PASS: deep route reload and field event creation offline');
    await page.goto(`http://127.0.0.1:4178/plantings/${cycleId}/evolution/new`);
    await page
      .locator('#photo-file')
      .setInputFiles({
        name: 'praga.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6bW8AAAAASUVORK5CYII=',
          'base64',
        ),
      });
    await page.getByRole('button', { name: 'Salvar foto', exact: true }).click();
    await page.getByRole('heading', { name: 'Evolução do plantio', exact: true }).waitFor();
    await page.locator('.photo-vue-card img').waitFor();
    await page.reload();
    await page.locator('.photo-vue-card img').waitFor();
    assert.equal(
      await page
        .locator('.photo-vue-card img')
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    console.log('PASS: photo bytes and gallery survive offline reload');
    await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('sb-127-auth-token'));
      session.expires_at = Math.floor(Date.now() / 1000) - 3600;
      const parts = session.access_token.split('.');
      const claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      claims.exp = session.expires_at;
      parts[1] = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      session.access_token = parts.join('.');
      localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
    });
    await page.reload();
    await page.locator('.photo-vue-card img').waitFor();
    console.log('PASS: expired network session does not block local offline access');
    await page.screenshot({
      path: resolve(process.env.OFFLINE_TEST_SCREENSHOT || '../work/offline-gallery.png'),
      fullPage: true,
    });
    await context.setOffline(false);
    console.log('Reconnected; opening synchronization panel');
    await page.goto('http://127.0.0.1:4178/more/settings#offline');
    console.log('Panel route', page.url());
    const button = page.getByRole('button', { name: 'Sincronizar agora', exact: true });
    if (await button.isEnabled()) await button.click();
    try {
      let status = '';
      for (let attempt = 0; attempt < 120; attempt++) {
        status = await page.locator('#offline').textContent();
        if (committed.size === 2 && /\b0\s+registro\(s\)\s+aguardando\s+envio\./.test(status)) break;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      assert.match(status, /\b0\s+registro\(s\)\s+aguardando\s+envio\./);
    } catch (error) {
      console.log(
        'SYNC STATUS',
        await page.locator('#offline').textContent(),
        'operations',
        committed.size,
        'errors',
        errors,
      );
      throw error;
    }
    assert.equal(committed.size, 2);
    assert.equal(events.length, 2);
    assert.equal(storedPhotos.length, 1);
    console.log('PASS: reconnect sends 2 operations with 2 events and 1 photo');
    assert.deepEqual(errors, []);
    console.log('PASS: no uncaught browser errors');
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

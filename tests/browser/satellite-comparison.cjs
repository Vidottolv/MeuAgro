const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(process.env.SATELLITE_TEST_DIST || 'dist');
const uid = '11111111-1111-4111-8111-111111111111',
  pid = '22222222-2222-4222-8222-222222222222',
  aid = '33333333-3333-4333-8333-333333333333';
const property = {
  id: pid,
  user_id: uid,
  owner_id: uid,
  name: 'Sítio Horizonte',
  deleted_at: null,
  status: 'active',
};
const functionActions = [];
let denyViewId = null;
const states = new Map(),
  images = [],
  commands = [],
  errors = [];
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
    res.writeHead(200, {
      'content-type':
        { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' }[
          extname(file)
        ] || 'application/octet-stream',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
(async () => {
  await new Promise((done) => server.listen(4186, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('https://tile.openstreetmap.org/**', (route) =>
      route.fulfill({
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6bW8AAAAASUVORK5CYII=',
          'base64',
        ),
      }),
    );
    const user = {
      id: uid,
      email: 'teste@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { full_name: 'Produtor Teste' },
    };
    const token =
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
      '.' +
      Buffer.from(
        JSON.stringify({
          sub: uid,
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
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname,
        headers = {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        };
      let data = [];
      if (req.method() === 'OPTIONS') return route.fulfill({ headers, body: '{}' });
      if (path === '/auth/v1/user') data = user;
      else if (path === '/auth/v1/token') data = session;
      else if (path.endsWith('/properties')) data = [property];
      else if (path.endsWith('/rpc/property_share_list')) data = [];
      else if (path.endsWith('/rpc/satellite_status'))
        data = {
          entitlement: {
            enabled: true,
            max_fields: 5,
            max_field_ha: 1000,
            requests_month: 200,
            pu_month: 200,
          },
          usage: null,
          fields: [aid],
          provider_ready: true,
        };
      else if (path.endsWith('/rpc/satellite_image_list')) data = images;
      else if (path.endsWith('/functions/v1/satellite-imagery')) {
        const body = req.postDataJSON();
        functionActions.push(body.action);
        if (body.action === 'search')
          return route.fulfill({
            headers,
            body: JSON.stringify({
              id: crypto.randomUUID(),
              status: 'ready',
              result: {
                scenes: [
                  {
                    id: 'S2-available',
                    properties: { datetime: body.to + 'T13:00:00Z', 'eo:cloud_cover': 5 },
                  },
                  {
                    id: 'S2-cloudy',
                    properties: { datetime: body.to + 'T14:00:00Z', 'eo:cloud_cover': 90 },
                  },
                ],
                truncated: false,
              },
            }),
          });
        if (body.action === 'process') assert.equal(body.scene_id, 'S2-available');
        if (body.action === 'view' && body.id === denyViewId)
          return route.fulfill({
            status: 403,
            headers,
            body: JSON.stringify({ error: 'Acesso revogado.' }),
          });
        if (body.action === 'view')
          return route.fulfill({
            headers: {
              ...headers,
              'content-type': 'application/octet-stream',
              'cache-control': 'no-store',
            },
            body: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6bW8AAAAASUVORK5CYII=',
              'base64',
            ),
          });
        const image = {
          id: crypto.randomUUID(),
          day: body.day,
          layer: body.layer,
          status: 'ready',
          metadata: {
            bounds: [-48, -16, -47.99, -15.99],
            source: 'Sentinel-2 / fixture de teste',
            acquisition_at: body.day + 'T13:00:00Z',
            scene_cloud_percent: 5,
            resolution_m: 10,
          },
        };
        images.push(image);
        data = { id: image.id, status: 'ready', metadata: image.metadata };
      } else if (path.endsWith('/rpc/geo_context')) {
        const key = req.postDataJSON().p_area || 'property',
          current = states.get(key) || null;
        data = {
          property,
          property_boundary: states.get('property')?.geometry || null,
          areas: [{ id: aid, name: 'Talhão Norte' }],
          current,
          versions: current ? [current] : [],
        };
      } else if (path.endsWith('/rpc/geo_command')) {
        const { p_action, p_data } = req.postDataJSON();
        commands.push({ p_action, p_data });
        const v = {
          ...p_data,
          id: crypto.randomUUID(),
          status: 'approved',
          hectares: 120,
          created_at: new Date().toISOString(),
        };
        states.set(p_data.area_id || 'property', v);
        data = v.id;
      }
      await route.fulfill({ headers, body: JSON.stringify(data) });
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
    await page.bringToFront();
    await page.goto('http://127.0.0.1:4186/more/satellite');
    await page.locator('#geo-property option[value="0"]').waitFor({ state: 'attached' });
    await page.locator('#geo-property').selectOption('0');
    await page.getByText('Informar coordenadas ou importar GeoJSON', { exact: true }).click();
    await page.locator('#geo-coordinates').fill('-16;-48');
    await page.getByRole('button', { name: 'Aplicar coordenadas', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar contorno', exact: true }).click();
    await page.getByText('Contorno atualizado.', { exact: true }).waitFor();
    assert.equal(commands[0].p_data.geometry.type, 'Point');
    await page.locator('#geo-area').selectOption(aid);
    await page.getByText('Informar coordenadas ou importar GeoJSON', { exact: true }).click();
    await page.locator('#geo-coordinates').fill('-16;-48\n-16;-47.99\n-15.99;-47.99\n-15.99;-48');
    await page.getByRole('button', { name: 'Aplicar coordenadas', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar contorno', exact: true }).click();
    await page.getByText('Área aproximada do contorno aprovado:', { exact: false }).waitFor();
    assert.equal(commands[1].p_data.geometry.type, 'Polygon');
    assert.equal(commands[1].p_data.area_id, aid);
    await page.getByRole('button', { name: 'Iniciar novo desenho', exact: true }).click();
    const map = page.locator('.boundary-map');
    await map.click({ position: { x: 90, y: 120 } });
    await map.click({ position: { x: 200, y: 120 } });
    await map.click({ position: { x: 190, y: 210 } });
    await page.getByRole('button', { name: 'Finalizar desenho', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar contorno', exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('button.button--primary')?.disabled === true,
    );
    assert.equal(commands[2].p_data.source, 'map');
    assert.equal(commands[2].p_data.geometry.coordinates[0].length, 4);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/satellite-map.png', fullPage: true });
    console.log('PASS: property reference point, field polygon, map drawing and mobile layout');
    await page.reload();
    await page.locator('#geo-property option[value="0"]').waitFor({ state: 'attached' });
    await page.locator('#geo-property').selectOption('0');
    await page.locator('#geo-area').selectOption(aid);
    await page.getByText('Área aproximada do contorno aprovado:', { exact: false }).waitFor();
    assert.ok((await page.locator('.leaflet-interactive').count()) > 0);
    assert.equal(
      await page.getByRole('button', { name: 'Consultar imagem', exact: true }).isDisabled(),
      true,
    );
    await page.getByRole('button', { name: 'Buscar cenas disponíveis', exact: true }).click();
    await page.locator('#satellite-scene').selectOption('S2-available');
    assert.equal(
      await page.locator('#satellite-scene option[value="S2-cloudy"]').isDisabled(),
      true,
    );
    await page.getByRole('button', { name: 'Consultar imagem', exact: true }).click();
    await page.getByRole('button', { name: /^Visualizar NDVI de/ }).click();
    await page.getByRole('img', { name: 'Índice de vegetação do talhão', exact: true }).waitFor();
    await page.locator('.leaflet-image-layer').waitFor();
    assert.equal(
      await page
        .getByRole('img', { name: 'Índice de vegetação do talhão', exact: true })
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    await page.screenshot({ path: '../work/satellite-ndvi.png', fullPage: true });
    await page.getByRole('button', { name: 'Ocultar imagem', exact: true }).click();
    assert.equal(await page.locator('.leaflet-image-layer').count(), 0);
    await page.locator('#satellite-layer').selectOption('rgb');
    await page.getByRole('button', { name: 'Consultar imagem', exact: true }).click();
    await page.getByRole('button', { name: /^Visualizar cores naturais de/ }).click();
    await page
      .getByRole('img', { name: 'Imagem em cores naturais do talhão', exact: true })
      .waitFor();
    console.log('PASS: NDVI and natural-color images, private Blob and map overlay');
    const recent = images.find((i) => i.layer === 'ndvi');
    const olderDate = new Date(recent.day + 'T12:00:00Z');
    olderDate.setUTCDate(olderDate.getUTCDate() - 7);
    const oldDay = olderDate.toISOString().slice(0, 10);
    for (const kind of ['ndvi', 'rgb']) {
      const source = images.find((i) => i.layer === kind);
      images.push({
        ...source,
        id: crypto.randomUUID(),
        day: oldDay,
        metadata: { ...source.metadata, acquisition_at: oldDay + 'T13:00:00Z' },
      });
    }
    await page.getByRole('button', { name: 'Atualizar histórico de imagens', exact: true }).click();
    await page.locator('#comparison-first option').nth(2).waitFor({ state: 'attached' });
    assert.equal(
      await page.getByRole('button', { name: 'Abrir comparação', exact: true }).isDisabled(),
      true,
    );
    await page.locator('#comparison-first').selectOption(recent.id);
    assert.equal(
      await page.locator('#comparison-second option[value="' + recent.id + '"]').isDisabled(),
      true,
    );
    const older = images.find((i) => i.layer === 'ndvi' && i.day === oldDay);
    await page.locator('#comparison-second').selectOption(older.id);
    const before = functionActions.slice();
    await page.getByRole('button', { name: 'Abrir comparação', exact: true }).click();
    await page.locator('.comparison-images img').nth(1).waitFor();
    assert.deepEqual(functionActions.slice(before.length), ['view', 'view']);
    assert.equal(await page.locator('.comparison-images img').count(), 2);
    assert.ok(
      (await page.locator('.comparison-images figure').first().textContent()).includes(
        oldDay.split('-').reverse().join('/'),
      ),
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/satellite-comparison-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    const columns = await page
      .locator('.comparison-images')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns, 2);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Fechar comparação', exact: true }).click();
    assert.equal(await page.locator('.comparison-images').count(), 0);
    await page.locator('#comparison-layer').selectOption('rgb');
    assert.equal(
      await page.getByRole('button', { name: 'Abrir comparação', exact: true }).isDisabled(),
      true,
    );
    const rgb = images.filter((i) => i.layer === 'rgb');
    await page.locator('#comparison-first').selectOption(rgb[0].id);
    await page.locator('#comparison-second').selectOption(rgb[1].id);
    await page.getByRole('button', { name: 'Abrir comparação', exact: true }).click();
    await page.locator('.comparison-images img').nth(1).waitFor();
    console.log(
      'PASS: two saved dates, matching layers, no catalog/process calls, mobile and desktop layout',
    );
    await page.getByRole('button', { name: 'Fechar comparação', exact: true }).click();
    denyViewId = rgb[0].id;
    await page.getByRole('button', { name: 'Abrir comparação', exact: true }).click();
    await page
      .getByText(
        'Não foi possível abrir as duas imagens. Atualize o histórico e confira sua conexão e permissão.',
        { exact: true },
      )
      .waitFor();
    assert.equal(await page.locator('.comparison-images').count(), 0);
    denyViewId = null;
    await page.getByRole('button', { name: 'Abrir comparação', exact: true }).click();
    await page.locator('.comparison-images img').nth(1).waitFor();
    console.log('PASS: partial access denial hides both comparison images');
    await context.setOffline(true);
    await page
      .getByText(
        'Conecte-se para consultar ou salvar contornos. O mapa-base não é preparado para uso offline.',
        { exact: true },
      )
      .waitFor();
    assert.equal(await page.locator('.boundary-map').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: saved boundary reload and offline clearing without uncaught errors');
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

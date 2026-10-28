import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  evalscript,
  imageSpec,
  selectScene,
  processRequest,
  processingUnits,
} from '../supabase/functions/satellite-imagery/provider.js';
import { createSatelliteHandler } from '../supabase/functions/satellite-imagery/handler.js';
const uid = '11111111-1111-4111-8111-111111111111',
  area = '22222222-2222-4222-8222-222222222222',
  id = '33333333-3333-4333-8333-333333333333';
const geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-48, -16],
      [-47.99, -16],
      [-47.99, -15.99],
      [-48, -15.99],
      [-48, -16],
    ],
  ],
};
const scene = {
  id: 'S2-test',
  properties: { datetime: '2026-10-01T13:00:00Z', 'eo:cloud_cover': 5 },
};
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
test('PU ausente, vazio ou inválido não é zero confirmado', () => {
  for (const value of [null, '', ' ', '-1', 'NaN', 'Infinity']) {
    const headers = value === null ? {} : { 'x-processingunits-spent': value };
    assert.equal(processingUnits(new Response(null, { headers })), null);
  }
  assert.equal(
    processingUnits(new Response(null, { headers: { 'x-processingunits-spent': '0' } })),
    0,
  );
});
function setup({
  chosenScene = false,
  searchCached = false,
  catalogStatus = 200,
  cached = false,
  clouds = false,
  missingUnits = false,
  failProcess = false,
  failSearch = false,
  failAuth = false,
  denyView = false,
} = {}) {
  const calls = [],
    rpcCalls = [],
    finished = [];
  let downloads = 0,
    checks = 0;
  const user = {
    auth: { getUser: async () => ({ data: { user: { id: uid } }, error: null }) },
    rpc: async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'satellite_image_access') {
        checks++;
        return denyView && checks > 1
          ? { error: { message: 'Revogado.' } }
          : { data: { storage_path: uid + '/' + id + '.png' } };
      }
      return { data: null };
    },
  };
  const admin = {
    rpc: async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'satellite_search_claim')
        return {
          data: {
            id,
            lease: 'lease',
            claimed: !searchCached,
            status: 'ready',
            geometry,
            result: { scenes: [scene] },
          },
        };
      if (name === 'satellite_search_finish') {
        finished.push(args);
        return { data: null };
      }
      if (name === 'satellite_image_claim' || name === 'satellite_scene_image_claim')
        return {
          data: {
            id,
            lease: 'lease',
            claimed: !cached,
            status: cached ? 'ready' : 'processing',
            geometry,
            ...(chosenScene ? { scene } : {}),
          },
        };
      if (name === 'satellite_image_finish') finished.push(args);
      return { data: null };
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        download: async () => {
          downloads++;
          return { data: new Blob([png], { type: 'image/png' }) };
        },
      }),
    },
  };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/token') && failAuth) return Response.json({}, { status: 401 });
    if (url.includes('/token'))
      return Response.json({ access_token: 'provider-token', expires_in: 300 });
    if (url.endsWith('/search')) {
      if (failSearch) throw new DOMException('timeout', 'TimeoutError');
      assert.equal(options.headers.accept, 'application/geo+json');
      assert.equal(options.headers['content-type'], 'application/json');
      return Response.json(
        { features: clouds ? [] : [scene] },
        {
          status: catalogStatus,
          headers: missingUnits ? {} : { 'x-processingunits-spent': '.01' },
        },
      );
    }
    assert.equal(options.headers.accept, 'image/png');
    if (failProcess) throw Error('Timeout');
    return new Response(png, {
      headers: { 'content-type': 'image/png', 'x-processingunits-spent': '1.5' },
    });
  };
  const env = (key) =>
    ({
      SATELLITE_ENABLED: 'true',
      COPERNICUS_CLIENT_ID: 'test-client',
      COPERNICUS_CLIENT_SECRET: 'test-secret',
    })[key];
  const handler = createSatelliteHandler({
    env,
    userClient: () => user,
    adminClient: () => admin,
    fetcher,
  });
  const request = (
    body = { action: 'process', area_id: area, day: '2026-10-01', layer: 'ndvi' },
    headers = { authorization: 'Bearer caller-token' },
  ) =>
    handler(
      new Request('http://edge.test', { method: 'POST', headers, body: JSON.stringify(body) }),
    );
  return { request, calls, rpcCalls, finished, downloads: () => downloads };
}
test('NDVI usa vermelho e infravermelho; nuvens e denominador zero são transparentes', () => {
  const ctx = vm.createContext({});
  vm.runInContext(evalscript('ndvi'), ctx);
  const valid = { B04: 0.1, B08: 0.3, SCL: 4, dataMask: 1 };
  const color = Array.from(ctx.evaluatePixel(valid));
  assert.equal(color[3], 1);
  assert.ok(color[1] > color[0]);
  assert.deepEqual(Array.from(ctx.evaluatePixel({ ...valid, SCL: 9 })), [0, 0, 0, 0]);
  assert.deepEqual(Array.from(ctx.evaluatePixel({ ...valid, B04: 0, B08: 0 })), [0, 0, 0, 0]);
  assert.deepEqual(Array.from(ctx.evaluatePixel({ ...valid, dataMask: 0 })), [0, 0, 0, 0]);
});

test('busca distingue zero anterior ao catálogo, timeout e cabeçalho ausente', async () => {
  const body = { action: 'search', area_id: area, from: '2026-10-01', to: '2026-10-15' };
  for (const [options, requests, pu] of [
    [{ failAuth: true }, 0, 0],
    [{ failSearch: true }, 1, null],
    [{ missingUnits: true }, 1, null],
    [{ catalogStatus: 429 }, 1, 0.01],
  ]) {
    const f = setup(options);
    await f.request(body);
    assert.equal(f.finished.length, 1);
    assert.equal(f.finished[0].p_pu, pu);
    assert.equal(f.finished[0].p_result.actual_requests, requests);
    assert.equal(f.calls.filter((c) => c.url.endsWith('/search')).length, requests);
    assert.doesNotMatch(JSON.stringify(f.finished), /test-secret|provider-token/);
  }
});
test('prévia limitada, Mercator, cena na data e limite de nuvens', () => {
  const spec = imageSpec(geometry);
  assert.ok(spec.width <= 512 && spec.height <= 512);
  assert.ok(spec.resolution_m >= 10);
  const body = processRequest(spec, scene, 'rgb');
  assert.ok(body.input.bounds.properties.crs.endsWith('/3857'));
  assert.equal(body.output.responses[0].format.type, 'image/png');
  assert.equal(selectScene({ features: [scene] }, '2026-10-02'), null);
  assert.equal(
    selectScene(
      { features: [{ ...scene, properties: { ...scene.properties, 'eo:cloud_cover': 80 } }] },
      '2026-10-01',
    ),
    null,
  );
});
test('consulta verifica usuário, reserva antes do provedor e persiste resultado e consumo', async () => {
  const f = setup();
  const result = await f.request({
    ...{ action: 'process', area_id: area, day: '2026-10-01', layer: 'ndvi' },
    user_id: 'forged',
  });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, 'ready');
  assert.equal(f.rpcCalls[0].args.p_user, uid);
  assert.equal(f.calls.length, 3);
  assert.equal(f.finished[0].p_requests, 2);
  assert.equal(f.finished[0].p_pu, 1.51);
  assert.equal(f.finished[0].p_metadata.scene_cloud_percent, 5);
});
test('cache não chama provedor; ausência de cena e falha não repetem chamadas', async () => {
  const cached = setup({ cached: true });
  assert.equal((await cached.request()).status, 200);
  assert.equal(cached.calls.length, 0);
  const empty = setup({ clouds: true });
  assert.equal((await (await empty.request()).json()).status, 'no_data');
  assert.equal(empty.calls.length, 2);
  assert.equal(empty.finished[0].p_requests, 1);
  const failed = setup({ failProcess: true });
  assert.equal((await failed.request()).status, 502);
  assert.equal(failed.calls.length, 3);
  assert.equal(failed.finished[0].p_status, 'failed');
  assert.equal(failed.finished[0].p_pu, null);
});
test('cabeçalho ausente mantém consumo total desconhecido; leitura confere revogação novamente', async () => {
  const f = setup({ missingUnits: true });
  await f.request();
  assert.equal(f.finished[0].p_pu, null);
  assert.equal(f.finished[0].p_metadata.observed_pu_lower_bound, 1.5);
  const denied = setup({ denyView: true });
  assert.equal((await denied.request({ action: 'view', id })).status, 400);
  assert.equal(denied.downloads(), 1);
  const allowed = setup();
  const image = await allowed.request({ action: 'view', id });
  assert.equal(image.headers.get('content-type'), 'application/octet-stream');
  assert.equal(image.headers.get('cache-control'), 'no-store');
});
test('origem, sessão ausente e parâmetros inválidos não reservam consumo', async () => {
  const f = setup();
  assert.equal((await f.request(undefined, {})).status, 401);
  assert.equal(
    (await f.request(undefined, { authorization: 'Bearer valid', origin: 'https://evil.test' }))
      .status,
    403,
  );
  assert.equal((await f.request({ action: 'process', area_id: 'invalid' })).status, 400);
  assert.equal(f.rpcCalls.length, 0);
  assert.equal(f.calls.length, 0);
});

test('diagnóstico de catálogo preserva HTTP sem expor credenciais ou corpos', async () => {
  const f = setup({ catalogStatus: 403 });
  const response = await f.request();
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.match(body.error, /catalog.*403/);
  assert.equal(f.finished[0].p_metadata.stage, 'catalog');
  assert.equal(f.finished[0].p_metadata.provider_http_status, 403);
  assert.equal(f.finished[0].p_requests, 1);
  assert.equal(f.calls.length, 2);
  assert.doesNotMatch(
    JSON.stringify([body, f.finished]),
    /test-secret|provider-token|caller-token/,
  );
});

test('busca de intervalo reutiliza cache; processar cena selecionada não chama catálogo', async () => {
  const f = setup();
  const r = await (
    await f.request({ action: 'search', area_id: area, from: '2026-10-01', to: '2026-10-15' })
  ).json();
  assert.equal(r.status, 'ready');
  assert.equal(r.result.scenes.length, 1);
  assert.equal(f.calls.length, 2);
  assert.equal(f.finished[0].p_pu, 0.01);
  const payload = JSON.parse(f.calls[1].options.body);
  assert.equal(payload.limit, 100);
  assert.equal(payload.datetime, '2026-10-01T00:00:00Z/2026-10-15T23:59:59Z');
  const cached = setup({ searchCached: true });
  await cached.request({ action: 'search', area_id: area, from: '2026-10-01', to: '2026-10-15' });
  assert.equal(cached.calls.length, 0);
  const selected = setup({ chosenScene: true });
  const image = await selected.request({
    action: 'process',
    area_id: area,
    day: '2026-10-01',
    layer: 'ndvi',
    search_id: id,
    scene_id: scene.id,
  });
  assert.equal(image.status, 200);
  assert.equal(selected.calls.length, 2);
  assert.equal(selected.calls.filter((c) => c.url.endsWith('/search')).length, 0);
  assert.equal(selected.finished[0].p_requests, 1);
  assert.equal(selected.rpcCalls[0].name, 'satellite_scene_image_claim');
});

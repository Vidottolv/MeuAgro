import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { buildWorker } from '../src/pwa/worker-template.mjs';
import { createPwaController, detectPwaEnvironment } from '../src/pwa/controller.js';
import { pwaBuildProblems } from '../scripts/pwa-policy.mjs';

test('publicação exige origens HTTPS confirmadas e recusa chaves privadas', () => {
  const env = {
    VITE_APP_URL: 'https://meuagro.example',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    MEU_AGRO_EXPECTED_SUPABASE_HOST: 'test.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  };
  assert.deepEqual(pwaBuildProblems(env, {}), []);
  for (const patch of [
    { VITE_APP_URL: 'http://localhost:5173' },
    { VITE_APP_URL: 'https://meuagro.example/subpasta' },
    { VITE_APP_URL: 'https://meuagro.example/?code=private' },
    { MEU_AGRO_EXPECTED_SUPABASE_HOST: 'wrong.supabase.co' },
    { VITE_OPENAI_API_KEY: 'private' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private' },
  ])
    assert.ok(pwaBuildProblems({ ...env, ...patch }, {}).length);
});

function fixture({
  native = false,
  secure = true,
  ios = false,
  standalone = false,
  failure = false,
} = {}) {
  const events = {},
    regEvents = {},
    calls = [],
    workerEvents = {};
  const worker = {
    state: 'installing',
    addEventListener: (name, fn) => {
      workerEvents[name] = fn;
    },
  };
  const registration = {
    active: null,
    waiting: null,
    installing: worker,
    update: async () => calls.push('update'),
    addEventListener: (name, fn) => {
      regEvents[name] = fn;
    },
  };
  const nav = {
    userAgent: ios ? 'iPhone' : 'Desktop',
    onLine: true,
    standalone,
    serviceWorker: {
      register: async (...args) => {
        calls.push(args);
        if (failure) throw Error('network');
        return registration;
      },
      addEventListener: (name, fn) => {
        events[name] = fn;
      },
    },
    storage: {
      estimate: async () => ({ usage: 1, quota: 10 }),
      persisted: async () => false,
      persist: async () => false,
    },
  };
  const win = {
    isSecureContext: secure,
    matchMedia: () => ({ matches: false }),
    addEventListener: (name, fn) => {
      events[name] = fn;
    },
    document: { addEventListener() {} },
  };
  return {
    api: createPwaController({ win, nav, native }),
    win,
    nav,
    events,
    calls,
    registration,
    workerEvents,
    worker,
  };
}
test('iPhone, iPad em modo desktop e instalação standalone são reconhecidos', () => {
  const win = { isSecureContext: true, matchMedia: () => ({ matches: true }) };
  assert.equal(detectPwaEnvironment(win, { userAgent: 'iPhone' }).ios, true);
  assert.equal(detectPwaEnvironment(win, { platform: 'MacIntel', maxTouchPoints: 5 }).ios, true);
  assert.equal(detectPwaEnvironment(win, { platform: 'MacIntel', maxTouchPoints: 0 }).ios, false);
  assert.equal(detectPwaEnvironment(win, {}).standalone, true);
});
test('registro é único, sem cache HTTP de worker, e não ocorre no Android nativo ou HTTP inseguro', async () => {
  const f = fixture();
  await f.api.start();
  await f.api.start();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][1].updateViaCache, 'none');
  for (const options of [{ native: true }, { secure: false }]) {
    const blocked = fixture(options);
    await blocked.api.start();
    assert.equal(blocked.calls.length, 0);
  }
});
test('nova versão fica aguardando: não envia mensagem de ativação nem recarrega tela', async () => {
  const f = fixture();
  await f.api.start();
  f.registration.active = {};
  f.registration.waiting = { postMessage: () => assert.fail('Ativação forçada') };
  f.worker.state = 'installed';
  f.workerEvents.statechange();
  assert.equal(f.api.getState().updateReady, true);
  await f.api.checkUpdate();
  assert.ok(f.calls.includes('update'));
  assert.match(f.api.getState().message, /Salve/);
});
test('falha de registro e falta de rede são comunicadas sem apagar dados', async () => {
  const f = fixture({ failure: true });
  await f.api.start();
  assert.equal(f.api.getState().worker, 'error');
  const offline = fixture();
  await offline.api.start();
  offline.nav.onLine = false;
  await offline.api.checkUpdate();
  assert.match(offline.api.getState().message, /internet/);
});
test('instalação usa gesto explícito e cancelamento não afirma instalação concluída', async () => {
  const f = fixture();
  await f.api.start();
  let count = 0;
  f.events.beforeinstallprompt({
    preventDefault() {},
    prompt: async () => {
      count++;
    },
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
  });
  assert.equal(count, 0);
  await f.api.install();
  assert.equal(count, 1);
  assert.equal(f.api.getState().installed, false);
  await f.api.install();
  assert.equal(count, 1);
  f.events.appinstalled();
  assert.equal(f.api.getState().installed, true);
});
test('persistência recusada e API indisponível não prometem backup', async () => {
  const f = fixture();
  await f.api.protectStorage();
  assert.equal(f.api.getState().storage.persistent, false);
  assert.match(f.api.getState().message, /não confirmou/);
  f.nav.storage = undefined;
  await f.api.refreshStorage();
  assert.equal(f.api.getState().storage.canRequest, false);
});

function workerFixture() {
  const handlers = {},
    deletes = [],
    network = [],
    installed = [];
  const cache = {
    addAll: async (requests) => installed.push(...requests),
    match: async (path) =>
      path === '/index.html'
        ? new Response('old-index')
        : path === '/assets/app.js'
          ? new Response('old-code')
          : undefined,
  };
  vm.runInNewContext(buildWorker({ version: 'v2', assets: ['/index.html', '/assets/app.js'] }), {
    self: {
      location: { origin: 'https://meuagro.test' },
      clients: { claim: async () => {} },
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      },
    },
    URL,
    Request: class {
      constructor(url, options) {
        this.url = url;
        this.cache = options.cache;
      }
    },
    caches: {
      open: async () => cache,
      keys: async () => ['another-app', 'meu-agro-shell-v1', 'meu-agro-shell-v2'],
      delete: async (key) => deletes.push(key),
    },
    fetch: async (req) => {
      network.push(req);
      return new Response('new-index');
    },
  });
  return { handlers, deletes, network, installed };
}
test('worker cacheia apenas assets, remove só seu cache antigo e não força ativação', async () => {
  const f = workerFixture();
  let task;
  f.handlers.install({
    waitUntil: (promise) => {
      task = promise;
    },
  });
  await task;
  assert.deepEqual(
    f.installed.map((r) => r.url),
    ['/index.html', '/assets/app.js'],
  );
  assert.ok(f.installed.every((r) => r.cache === 'reload'));
  f.handlers.activate({
    waitUntil: (promise) => {
      task = promise;
    },
  });
  await task;
  assert.deepEqual(f.deletes, ['meu-agro-shell-v1']);
});
test('navegação usa HTML da mesma versão; callbacks e dados privados não viram chaves de cache', async () => {
  const f = workerFixture();
  let response;
  f.handlers.fetch({
    request: {
      url: 'https://meuagro.test/auth/callback?code=private',
      method: 'GET',
      mode: 'navigate',
    },
    respondWith: (value) => {
      response = value;
    },
  });
  assert.equal(await (await response).text(), 'old-index');
  assert.equal(f.network.length, 0);
  for (const [url, method, mode] of [
    ['https://db.test/rest/v1/profiles', 'GET', 'cors'],
    ['https://meuagro.test/auth/v1/token', 'GET', 'navigate'],
    ['https://meuagro.test/storage/image.jpg', 'GET', 'cors'],
    ['https://meuagro.test/assets/app.js?token=x', 'GET', 'cors'],
    ['https://meuagro.test/private', 'POST', 'cors'],
  ])
    f.handlers.fetch({
      request: { url, method, mode },
      respondWith: () => assert.fail('Interceptou requisição privada'),
    });
});
test('manifesto e ícones têm identidade estável e dimensões reais, sem tokens no início', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../native/pwa/manifest.webmanifest', import.meta.url)),
  );
  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/dashboard');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL('../native/pwa' + icon.src, import.meta.url));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

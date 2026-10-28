import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { effectScope } from 'vue';
const url = (code) => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
const compile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const vue = import.meta.resolve('vue');
const resource = url(
  compile('../src/modules/inventory/shared/useResource.ts')
    .replace("from 'vue'", `from '${vue}'`)
    .replace(
      "from '../../../services/dataErrorService.js'",
      `from '${new URL('../src/services/dataErrorService.js', import.meta.url).href}'`,
    ),
);
const lifecycle = url(
  `export {onScopeDispose} from '${vue}';export const onMounted=fn=>globalThis.__sensitiveMounts.push(fn);`,
);
const runtime = url(
  'export const offlineUserId=()=>globalThis.__sensitiveState.user;export const isOnline=()=>globalThis.__sensitiveState.online;',
);
const code = compile('../src/modules/shared/useSensitiveResource.ts')
  .replace("from 'vue'", `from '${lifecycle}'`)
  .replace("from '../inventory/shared/useResource'", `from '${resource}'`)
  .replace("from '../../offline/runtime.js'", `from '${runtime}'`);
const { useSensitiveResource } = await import(url(code));
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function setup(fetcher) {
  globalThis.__sensitiveState = { user: 'account-a', online: true };
  globalThis.__sensitiveMounts = [];
  globalThis.document = new EventTarget();
  document.hidden = false;
  globalThis.window = new EventTarget();
  const scope = effectScope();
  const r = scope.run(() => useSensitiveResource(fetcher, null));
  for (const mount of globalThis.__sensitiveMounts) mount();
  return { r, scope };
}
test('dados privados são limpos em offline, aba oculta e falha de autorização', async () => {
  let fail = false;
  const { r, scope } = setup(async () => {
    if (fail) throw Object.assign(Error('Acesso revogado'), { code: '42501' });
    return { secret: 'financeiro' };
  });
  try {
    await tick();
    assert.equal(r.data.value.secret, 'financeiro');
    __sensitiveState.online = false;
    window.dispatchEvent(new Event('offline'));
    assert.equal(r.data.value, null);
    __sensitiveState.online = true;
    window.dispatchEvent(new Event('online'));
    await tick();
    assert.ok(r.data.value);
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(r.data.value, null);
    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await tick();
    assert.ok(r.data.value);
    fail = true;
    await r.reload();
    assert.equal(r.data.value, null);
    assert.ok(r.error.value);
  } finally {
    scope.stop();
  }
});
test('resposta da conta anterior não aparece após troca de sessão nem sobrescreve conta nova', async () => {
  let release;
  let first = true;
  const { r, scope } = setup(() => {
    if (first) {
      first = false;
      return new Promise((resolve) => (release = resolve));
    }
    return Promise.resolve({ account: __sensitiveState.user });
  });
  try {
    __sensitiveState.user = 'account-b';
    window.dispatchEvent(new Event('meu-agro-offline-changed'));
    await tick();
    assert.equal(r.data.value.account, 'account-b');
    release({ account: 'account-a', secret: 'antigo' });
    await tick();
    assert.deepEqual(r.data.value, { account: 'account-b' });
    __sensitiveState.user = null;
    window.dispatchEvent(new Event('meu-agro-offline-changed'));
    assert.equal(r.data.value, null);
  } finally {
    scope.stop();
  }
});
test('resposta depois de sair da página é ignorada', async () => {
  let release;
  const { r, scope } = setup(() => new Promise((resolve) => (release = resolve)));
  scope.stop();
  release({ secret: 'fora da página' });
  await tick();
  assert.equal(r.data.value, null);
});

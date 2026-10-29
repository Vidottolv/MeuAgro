import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) =>
  readFileSync(new URL('../src/services/' + file, import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '')
    .replaceAll('export ', '');
function runtime(platform, launchUrl) {
  const listeners = {},
    calls = [];
  const app = {
    addListener: async (name, fn) => {
      listeners[name] = fn;
      return { remove: async () => calls.push('remove:' + name) };
    },
    getLaunchUrl: async () => ({ url: launchUrl }),
    exitApp: async () => calls.push('exit'),
  };
  const api = new Function(
    'App',
    'Capacitor',
    'completeAuthCallback',
    'closeAuthBrowser',
    'supabase',
    'isNativeAuthUrl',
    'window',
    source('nativeRuntimeService.js') +
      ';return {initializeNativeRuntime, removeNativeRuntimeListeners,handleNativeAppUrl};',
  )(
    app,
    { isNativePlatform: () => platform !== 'web', getPlatform: () => platform },
    async () => {
      calls.push('callback');
      return '/dashboard';
    },
    async () => calls.push('close'),
    {},
    (value) => typeof value === 'string' && value.startsWith('meuagro://auth/'),
    { location: { pathname: '/dashboard' }, history: { length: 1 } },
  );
  return { api, calls, listeners };
}
test('iOS abre callback frio e quente sem registrar o botão Android', async () => {
  const f = runtime('ios', 'meuagro://auth/callback?code=cold');
  const routes = [];
  await f.api.initializeNativeRuntime({ navigate: (path) => routes.push(path) });
  assert.deepEqual(Object.keys(f.listeners), ['appUrlOpen']);
  await f.api.handleNativeAppUrl('meuagro://auth/callback?code=warm');
  await f.api.handleNativeAppUrl('meuagro://auth/callback?code=warm');
  assert.equal(f.calls.filter((c) => c === 'callback').length, 2);
  assert.deepEqual(routes, ['/dashboard']);
  await f.api.removeNativeRuntimeListeners();
  assert.ok(f.calls.includes('remove:appUrlOpen'));
});
test('Android mantém botão voltar e saída; navegador não registra eventos', async () => {
  const android = runtime('android');
  await android.api.initializeNativeRuntime();
  assert.equal(typeof android.listeners.backButton, 'function');
  android.listeners.backButton({ canGoBack: false });
  assert.ok(android.calls.includes('exit'));
  const web = runtime('web');
  await web.api.initializeNativeRuntime();
  assert.deepEqual(Object.keys(web.listeners), []);
});
function notifications(platform, pending = []) {
  let scheduled, cancelled;
  const plugin = {
    checkPermissions: async () => ({ display: 'granted' }),
    getPending: async () => ({ notifications: pending }),
    cancel: async (options) => {
      cancelled = options.notifications;
    },
    schedule: async (options) => {
      scheduled = options.notifications;
      return { notifications: scheduled };
    },
    createChannel: async () => {
      assert.equal(platform, 'android');
    },
    checkExactNotificationSetting: async () => {
      assert.equal(platform, 'android');
      return { exact_alarm: 'granted' };
    },
  };
  const api = new Function(
    'Capacitor',
    'LocalNotifications',
    source('localNotificationService.js') +
      ';return {syncNativeHarvestNotifications,getNotificationPlatformLabel};',
  )({ isNativePlatform: () => platform !== 'web', getPlatform: () => platform }, plugin);
  return {
    api,
    get scheduled() {
      return scheduled;
    },
    get cancelled() {
      return cancelled;
    },
  };
}
const reminders = () =>
  Array.from({ length: 70 }, (_, index) => ({
    id: 'n' + index,
    title: 'Colheita',
    body: 'Aviso',
    scheduled_for: new Date(Date.now() + (70 - index) * 3600000).toISOString(),
  }));
test('iOS prioriza lembretes próximos e preserva os de outras funções', async () => {
  const f = notifications('ios', [
    { id: 9, extra: { meuAgroType: 'other' } },
    { id: 10, extra: { meuAgroType: 'harvest_reminder' } },
  ]);
  const result = await f.api.syncNativeHarvestNotifications(reminders());
  assert.equal(f.api.getNotificationPlatformLabel(), 'iOS');
  assert.deepEqual(f.cancelled, [{ id: 10 }]);
  assert.equal(result.scheduled, 62);
  assert.ok(f.scheduled[0].schedule.at < f.scheduled.at(-1).schedule.at);
  assert.match(result.warning, /62 dos 70/);
});
test('Android preserva agenda completa e canal; iOS com agenda cheia avisa sem agendar', async () => {
  const a = notifications('android');
  assert.equal((await a.api.syncNativeHarvestNotifications(reminders())).scheduled, 70);
  const i = notifications(
    'ios',
    Array.from({ length: 64 }, (_, id) => ({ id })),
  );
  const result = await i.api.syncNativeHarvestNotifications(reminders());
  assert.equal(result.scheduled, 0);
  assert.match(result.warning, /0 dos 70/);
  assert.equal(i.scheduled, undefined);
});
test('iOS não registra token APNs no serviço FCM Android', async () => {
  let called = false;
  const api = new Function(
    'Capacitor',
    'PushNotifications',
    'localStorage',
    source('tradePushService.js').replaceAll('import.meta.env.VITE_PUSH_ENABLED', "'true'") +
      ';return {setPushSession,enableTradePush,pushStatus};',
  )(
    { getPlatform: () => 'ios' },
    {
      register: () => {
        called = true;
      },
    },
    { getItem: () => 'true' },
  );
  api.setPushSession({ user: { id: 'u1' } });
  await api.enableTradePush();
  assert.equal(called, false);
  assert.equal(api.pushStatus().available, false);
  assert.equal(api.pushStatus().enabled, false);
  assert.match(api.pushStatus().message, /Apple/);
});

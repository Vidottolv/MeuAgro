import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import plist from 'plist';
import {
  configureIosInfoPlist,
  iosConfigurationProblems,
  xcodeVersionSupported,
  iosBuildEnvironmentProblems,
} from '../scripts/ios-policy.mjs';

const json = (path) => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const fixture = () => ({
  release: json('native/ios/release.json'),
  capacitor: json('capacitor.config.json'),
  packages: json('package.json'),
});
test('As duas plataformas permanecem na mesma versão do Capacitor', () => {
  assert.deepEqual(iosConfigurationProblems(fixture()), []);
  const f = fixture();
  f.packages.dependencies['@capacitor/ios'] = '7.0.0';
  assert.match(iosConfigurationProblems(f).join(' '), /mesma versão/);
});
test('Preparação recusa live reload e versões inválidas', () => {
  const f = fixture();
  f.capacitor.server.url = 'http://192.168.1.2:5173';
  f.release.buildNumber = '0';
  f.release.versionName = 'beta';
  assert.equal(iosConfigurationProblems(f).length, 3);
});
test('Info.plist preserva customizações, inclui permissões e registra retorno do login', () => {
  const { release, capacitor } = fixture();
  const options = { release, appId: capacitor.appId };
  const original = {
    CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
    UIRequiredDeviceCapabilities: ['arm64'],
    CFBundleURLTypes: [{ CFBundleURLName: 'outra-integracao', CFBundleURLSchemes: ['outro'] }],
  };
  const configured = configureIosInfoPlist(original, options);
  const roundTrip = plist.parse(plist.build(configured));
  assert.equal(roundTrip.CFBundleIdentifier, original.CFBundleIdentifier);
  assert.deepEqual(roundTrip.UIRequiredDeviceCapabilities, ['arm64']);
  assert.deepEqual(roundTrip.CFBundleURLTypes.at(-1).CFBundleURLSchemes, ['meuagro']);
  assert.equal(roundTrip.CFBundleURLTypes[0].CFBundleURLName, 'outra-integracao');
  assert.match(roundTrip.NSCameraUsageDescription, /visita técnica/);
  assert.ok(roundTrip.NSPhotoLibraryUsageDescription);
  assert.ok(roundTrip.NSPhotoLibraryAddUsageDescription);
  assert.equal(roundTrip.CFBundleVersion, String(release.buildNumber));
  assert.deepEqual(configureIosInfoPlist(roundTrip, options), roundTrip);
  assert.equal(original.CFBundleVersion, undefined);
});
test('Configuração não aceita liberação global de HTTP', () => {
  const options = { release: fixture().release, appId: 'com.meuagro.app' };
  for (const key of ['NSAllowsArbitraryLoads', 'NSAllowsArbitraryLoadsInWebContent'])
    assert.throws(
      () => configureIosInfoPlist({ NSAppTransportSecurity: { [key]: true } }, options),
      /HTTP/,
    );
});
test('Xcode antigo ou saída desconhecida não passa na pré-conferência', () => {
  assert.equal(xcodeVersionSupported('Xcode 26.1\nBuild version 17B'), true);
  assert.equal(xcodeVersionSupported('Xcode 16.4'), false);
  assert.equal(xcodeVersionSupported(''), false);
});

test('Build iOS exige servidor confirmado e recusa segredos no bundle público', () => {
  const env = {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    MEU_AGRO_EXPECTED_SUPABASE_HOST: 'test.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  };
  assert.deepEqual(iosBuildEnvironmentProblems(env), []);
  assert.ok(
    iosBuildEnvironmentProblems({ ...env, MEU_AGRO_EXPECTED_SUPABASE_HOST: 'outro.supabase.co' })
      .length,
  );
  assert.ok(
    iosBuildEnvironmentProblems({ ...env, VITE_SUPABASE_URL: 'http://localhost:54321' }).length,
  );
  assert.ok(
    iosBuildEnvironmentProblems({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private' })
      .length,
  );
  assert.ok(
    iosBuildEnvironmentProblems({ ...env, VITE_OPENAI_API_KEY: 'sb_secret_private' }).length,
  );
  assert.ok(iosBuildEnvironmentProblems({ ...env, VITE_ASAAS_API_KEY: 'private' }).length);
});

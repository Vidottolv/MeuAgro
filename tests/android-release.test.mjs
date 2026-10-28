import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  releaseProblems,
  validateReleaseVersion,
  signatureVerified,
} from '../scripts/android-release-policy.mjs';
test('verificação recusa AAB sem assinatura ou com entradas não assinadas e APK inválido', () => {
  assert.equal(signatureVerified({ status: 0, stdout: 'jar is unsigned.' }, 'aab'), false);
  assert.equal(signatureVerified({ status: 0, stdout: 'jar verified.' }, 'aab'), true);
  assert.equal(
    signatureVerified(
      {
        status: 4,
        stdout: 'jar verified, with signer errors.\nThe signer certificate is self-signed.',
      },
      'aab',
    ),
    true,
  );
  for (const [status, stdout] of [
    [16, 'jar verified, with signer errors.'],
    [4, 'jar verified, with signer errors.\nCertificate has expired.'],
    [4, 'jar verified, with signer errors.\nAlgorithm disabled.'],
    [0, 'jar verified.\nThis JAR contains unsigned entries.'],
  ])
    assert.equal(signatureVerified({ status, stdout }, 'aab'), false);
  assert.equal(signatureVerified({ status: 1 }, 'apk'), false);
  assert.equal(signatureVerified({ status: 0 }, 'apk'), true);
  assert.equal(signatureVerified({ status: 0, error: Error('falha') }, 'apk'), false);
});
const release = JSON.parse(
  readFileSync(new URL('../native/android/release.json', import.meta.url)),
);
const capacitor = JSON.parse(readFileSync(new URL('../capacitor.config.json', import.meta.url)));
const manifest = readFileSync(
  new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
  'utf8',
);
const key = resolve('../work/fake-signing-file.jks');
const jwt = (role) =>
  'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify({ role })).toString('base64url') +
  '.test-signature';
function config() {
  return {
    release: { ...release },
    capacitor: structuredClone(capacitor),
    manifest,
    env: {
      MEU_AGRO_PREVIOUS_VERSION_CODE: '38',
      MEU_AGRO_EXPECTED_SUPABASE_HOST: 'pilot.supabase.co',
      VITE_SUPABASE_URL: 'https://pilot.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: jwt('anon'),
      MEU_AGRO_KEYSTORE_PATH: key,
      MEU_AGRO_KEYSTORE_PASSWORD: 'SEGREDO_TESTE',
      MEU_AGRO_KEY_ALIAS: 'meuagro',
      MEU_AGRO_KEY_PASSWORD: 'SEGREDO_TESTE',
    },
    fileExists: (p) => p === key,
  };
}
test('release exige versão superior, host confirmado e assinatura sem expor valores', () => {
  assert.deepEqual(releaseProblems(config()), []);
  for (const modify of [
    (c) => {
      c.env.MEU_AGRO_PREVIOUS_VERSION_CODE = String(release.versionCode);
    },
    (c) => {
      c.env.MEU_AGRO_EXPECTED_SUPABASE_HOST = 'outro.supabase.co';
    },
    (c) => {
      c.env.VITE_SUPABASE_URL = 'http://pilot.supabase.co';
    },
    (c) => {
      c.env.VITE_SUPABASE_URL = 'https://pilot.supabase.co/falso';
    },
    (c) => {
      c.env.VITE_SUPABASE_PUBLISHABLE_KEY = jwt('service_role');
    },
    (c) => {
      c.env.VITE_COPERNICUS_CLIENT_SECRET = 'SEGREDO_TESTE';
    },
    (c) => {
      c.env.VITE_OTHER_KEY = 'sb_secret_SEGREDO_TESTE';
    },
    (c) => {
      delete c.env.MEU_AGRO_KEY_PASSWORD;
    },
    (c) => {
      c.fileExists = () => false;
    },
    (c) => {
      c.env.MEU_AGRO_KEYSTORE_PATH = 'relative.jks';
    },
    (c) => {
      c.capacitor.server.url = 'http://192.168.1.2:5173';
    },
    (c) => {
      c.capacitor.android.allowMixedContent = true;
    },
    (c) => {
      c.capacitor.android.webContentsDebuggingEnabled = true;
    },
    (c) => {
      c.manifest = c.manifest.replace('android:allowBackup="false"', 'android:allowBackup="true"');
    },
    (c) => {
      c.manifest = c.manifest.replace('android:scheme="meuagro"', 'android:scheme="outro"');
    },
  ]) {
    const c = config();
    modify(c);
    const errors = releaseProblems(c);
    assert.ok(errors.length > 0);
    assert.doesNotMatch(JSON.stringify(errors), /SEGREDO_TESTE/);
  }
  for (const value of [0, -1, 1.5, 2100000001])
    assert.throws(() => validateReleaseVersion({ ...release, versionCode: value }));
  assert.throws(() => validateReleaseVersion({ ...release, versionName: '0.36.0"; malicious' }));
  assert.throws(() => validateReleaseVersion({ ...release, channel: 'dev' }));
});
test('Gradle recusa tarefas ou opções que injetariam comandos no Windows', () => {
  for (const args of [
    ['assembleDebug & echo BAD'],
    ['assembleDebug', '& echo BAD'],
    ['assembleRelease;echo BAD'],
  ]) {
    const r = spawnSync(process.execPath, ['scripts/android-gradle.mjs', ...args], {
      encoding: 'utf8',
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /única opção/);
    assert.doesNotMatch(r.stdout, /BAD/);
  }
});
test('regeneração nativa preserva fonte única de versão e bloqueio de release sem assinatura', () => {
  const parent = resolve('../work/android-release-config-tests');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, 'case-'));
  for (const file of [
    'scripts/android-apply-config.mjs',
    'scripts/android-release-policy.mjs',
    'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml',
    'native/android/release.json',
    'native/android/signing.gradle',
  ]) {
    mkdirSync(resolve(root, file, '..'), { recursive: true });
    cpSync(resolve(file), join(root, file));
  }
  cpSync(resolve('native/android/res'), join(root, 'native/android/res'), { recursive: true });
  const apply = () => {
    const r = spawnSync(process.execPath, [join(root, 'scripts/android-apply-config.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
  };
  apply();
  apply();
  const build = () => readFileSync(join(root, 'android/app/build.gradle'), 'utf8');
  assert.match(build(), new RegExp('versionCode ' + release.versionCode));
  assert.ok(build().includes('versionName "' + release.versionName + '"'));
  assert.equal((build().match(/apply from: '..\/meu-agro-signing.gradle'/g) || []).length, 1);
  const signer = readFileSync(join(root, 'android/meu-agro-signing.gradle'), 'utf8');
  assert.equal(signer, readFileSync('native/android/signing.gradle', 'utf8'));
  assert.match(signer, /throw new GradleException/);
  assert.doesNotMatch(signer, /gerado sem assinatura/);
  writeFileSync(
    join(root, 'native/android/release.json'),
    JSON.stringify({ ...release, versionCode: 41, versionName: '0.36.2' }),
  );
  apply();
  assert.match(build(), /versionCode 41/);
  assert.match(build(), /versionName "0.36.2"/);
  // Configuração inválida é rejeitada antes de modificar arquivos nativos.
  const before = build();
  writeFileSync(join(root, 'native/android/release.json'), '{}');
  const invalid = spawnSync(process.execPath, [join(root, 'scripts/android-apply-config.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(invalid.status, 1);
  assert.equal(build(), before);
});

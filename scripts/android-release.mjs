import {
  readFileSync,
  existsSync,
  statSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import { releaseProblems, signatureVerified } from './android-release-policy.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function runNode(args, env) {
  const r = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit', shell: false });
  if (r.error || r.status !== 0)
    throw Error('Etapa de build não concluída. Confira a saída acima.');
}
function javaHome(env) {
  const home =
    env.JAVA_HOME ||
    (process.platform === 'win32' ? 'C:/Program Files/Android/Android Studio/jbr' : '');
  if (!home || !existsSync(join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')))
    throw Error('Configure JAVA_HOME para o JDK usado pelo Android (21 ou superior).');
  return home;
}
function verifyArtifact(file, kind, env) {
  const bin = join(env.JAVA_HOME, 'bin');
  let command, args;
  if (kind === 'apk') {
    const sdk =
      env.ANDROID_HOME ||
      env.ANDROID_SDK_ROOT ||
      (process.platform === 'win32' && env.LOCALAPPDATA
        ? join(env.LOCALAPPDATA, 'Android', 'Sdk')
        : null);
    if (!sdk || !existsSync(join(sdk, 'build-tools')))
      throw Error('Configure ANDROID_HOME para verificar a assinatura do APK.');
    const versions = readdirSync(join(sdk, 'build-tools'))
      .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    const jar = versions
      .map((v) => join(sdk, 'build-tools', v, 'lib', 'apksigner.jar'))
      .find(existsSync);
    if (!jar) throw Error('Instale Android SDK Build Tools para conferir a assinatura do APK.');
    command = join(bin, process.platform === 'win32' ? 'java.exe' : 'java');
    args = ['-jar', jar, 'verify', '--verbose', '--print-certs', file];
  } else {
    command = join(bin, process.platform === 'win32' ? 'jarsigner.exe' : 'jarsigner');
    args = ['-J-Duser.language=en', '-J-Duser.country=US', '-verify', '-strict', file];
  }
  const result = spawnSync(command, args, { encoding: 'utf8', env, shell: false });
  if (!signatureVerified(result, kind))
    throw Error(
      'A assinatura do artefato não foi confirmada. Nenhum pacote será copiado para distribuição.',
    );
  return kind === 'apk' ? 'apksigner' : 'jarsigner';
}
try {
  if (Number(process.versions.node.split('.')[0]) < 22) throw Error('Use Node.js 22 ou superior.');
  const kind = process.argv[2];
  if (!['check', 'apk', 'aab'].includes(kind)) throw Error('Use check, apk ou aab.');
  const release = JSON.parse(readFileSync(join(root, 'native/android/release.json'), 'utf8'));
  const capacitor = JSON.parse(readFileSync(join(root, 'capacitor.config.json'), 'utf8'));
  // Mesma precedência de arquivos e modo do build Vite. Valores privados nunca são impressos.
  const env = { ...process.env, ...loadEnv('production', root, '') };
  const manifest = readFileSync(join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
  const errors = releaseProblems({
    release,
    capacitor,
    manifest,
    env,
    fileExists: (p) => existsSync(p) && statSync(p).isFile(),
  });
  if (errors.length) throw Error(errors.map((e) => '- ' + e).join('\n'));
  console.log(
    `Pré-conferência: ${release.versionName} (${release.versionCode}), canal ${release.channel}. Configuração aprovada; assinatura e build ainda serão verificados.`,
  );
  if (kind !== 'check') {
    const out = join(
      root,
      'release-artifacts',
      `${release.channel}-${release.versionName}-${release.versionCode}`,
    );
    const name = `meuagro-${release.versionName}-${release.versionCode}.${kind}`;
    if (existsSync(join(out, name)) || existsSync(join(out, `release-${kind}.json`)))
      throw Error(
        'Já existe este artefato de distribuição. Preserve-o e aumente versionCode para uma nova entrega.',
      );
    env.JAVA_HOME = javaHome(env);
    // Congela os valores públicos conferidos para o processo que compila os assets.
    runNode(['scripts/android-apply-config.mjs'], env);
    runNode(['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'], env);
    runNode(
      [
        'node_modules/vite/bin/vite.js',
        'build',
        '--mode',
        'production',
        '--configLoader',
        'runner',
      ],
      env,
    );
    runNode(['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android'], env);
    runNode(['scripts/android-apply-config.mjs'], env);
    const started = Date.now();
    runNode(
      [
        'scripts/android-gradle.mjs',
        kind === 'apk' ? 'assembleRelease' : 'bundleRelease',
        '--rerun-tasks',
      ],
      env,
    );
    const artifact = join(
      root,
      'android/app/build/outputs',
      kind === 'apk' ? 'apk/release/app-release.apk' : 'bundle/release/app-release.aab',
    );
    if (!existsSync(artifact))
      throw Error('Artefato release esperado não encontrado. Não use arquivos unsigned.');
    if (statSync(artifact).mtimeMs < started - 2000)
      throw Error(
        'O artefato parece anterior a esta execução. Confira o build antes de distribuir.',
      );
    const verifier = verifyArtifact(artifact, kind, env);
    const bytes = readFileSync(artifact),
      sha256 = createHash('sha256').update(bytes).digest('hex');
    mkdirSync(out, { recursive: true });
    copyFileSync(artifact, join(out, name));
    writeFileSync(
      join(out, `release-${kind}.json`),
      JSON.stringify(
        {
          schema: 'meuagro-release-v1',
          ...release,
          applicationId: capacitor.appId,
          supabase_host: new URL(env.VITE_SUPABASE_URL).hostname,
          created_at: new Date().toISOString(),
          artifact: name,
          bytes: bytes.length,
          sha256,
          signature_verified_by: verifier,
          device_homologation: 'pending',
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      `Artefato assinado e conferido em release-artifacts/${release.channel}-${release.versionName}-${release.versionCode}/${name}`,
    );
    console.log(
      `SHA-256: ${sha256}. Homologação no aparelho e aprovação do piloto continuam pendentes.`,
    );
  }
} catch (error) {
  console.error('Release Android não concluído:\n' + error.message);
  process.exitCode = 1;
}

import { isAbsolute } from 'node:path';
export function validateReleaseVersion(release) {
  if (
    !release ||
    !Number.isInteger(release.versionCode) ||
    release.versionCode < 1 ||
    release.versionCode > 2100000000 ||
    !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(release.versionName || '') ||
    !['pilot', 'production'].includes(release.channel)
  ) {
    throw Error('Revise versionName, versionCode e channel em native/android/release.json.');
  }
  return release;
}
function jwtRole(value) {
  try {
    return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role;
  } catch {
    return null;
  }
}
export function signatureVerified(result, kind) {
  if (result.error) return false;
  if (kind === 'apk') return result.status === 0;
  const output = (result.stdout || '') + '\n' + (result.stderr || '');
  return (
    [0, 4].includes(result.status) &&
    /jar verified(?:\.|, with signer errors\.)/i.test(output) &&
    !/unsigned entries|has expired|have expired|not yet valid|disabled|KeyUsage|NetscapeCertType/i.test(
      output,
    )
  );
}
export function releaseProblems({ release, capacitor, manifest, env, fileExists = () => false }) {
  const errors = [];
  try {
    validateReleaseVersion(release);
  } catch (e) {
    errors.push(e.message);
  }
  const previous = env.MEU_AGRO_PREVIOUS_VERSION_CODE;
  if (!/^\d+$/.test(previous || '') || Number(previous) >= release?.versionCode)
    errors.push(
      'Informe MEU_AGRO_PREVIOUS_VERSION_CODE com o maior código já distribuído; a nova versão deve ser maior.',
    );
  const expected = env.MEU_AGRO_EXPECTED_SUPABASE_HOST;
  try {
    const url = new URL(env.VITE_SUPABASE_URL || '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      !['', '/'].includes(url.pathname) ||
      !expected ||
      url.hostname !== expected ||
      /^(localhost|127\.|0\.|\[|\d+\.\d+\.\d+\.\d+$)/i.test(url.hostname)
    )
      throw Error();
  } catch {
    errors.push(
      'Confirme VITE_SUPABASE_URL HTTPS e MEU_AGRO_EXPECTED_SUPABASE_HOST (somente o domínio exato do projeto).',
    );
  }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  if (!key.startsWith('sb_publishable_') && jwtRole(key) !== 'anon')
    errors.push('Use somente chave pública publishable ou anon em VITE_SUPABASE_PUBLISHABLE_KEY.');
  if (
    Object.entries(env).some(
      ([name, value]) =>
        name.startsWith('VITE_') &&
        (/SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|ASAAS_API_KEY|COPERNICUS_CLIENT_SECRET/i.test(
          name,
        ) ||
          String(value).startsWith('sb_secret_') ||
          jwtRole(String(value)) === 'service_role'),
    )
  )
    errors.push(
      'Remova credenciais privadas das variáveis VITE_: elas são incorporadas no aplicativo.',
    );
  if (
    capacitor?.appId !== 'com.meuagro.app' ||
    capacitor?.webDir !== 'dist' ||
    capacitor?.server?.url ||
    capacitor?.server?.cleartext ||
    capacitor?.server?.androidScheme !== 'https' ||
    capacitor?.android?.allowMixedContent !== false ||
    capacitor?.android?.webContentsDebuggingEnabled !== false
  )
    errors.push(
      'Revise Capacitor: appId, dist, HTTPS local, sem live reload, conteúdo misto ou depuração.',
    );
  if (
    !/android:allowBackup="false"/.test(manifest || '') ||
    !/android:usesCleartextTraffic="false"/.test(manifest || '') ||
    !/android:scheme="meuagro"/.test(manifest || '') ||
    !/android:host="auth"/.test(manifest || '')
  )
    errors.push(
      'Revise o manifesto: backup e HTTP desativados e callback meuagro://auth configurado.',
    );
  if (
    ![
      'MEU_AGRO_KEYSTORE_PATH',
      'MEU_AGRO_KEYSTORE_PASSWORD',
      'MEU_AGRO_KEY_ALIAS',
      'MEU_AGRO_KEY_PASSWORD',
    ].every((k) => typeof env[k] === 'string' && env[k].length > 0)
  )
    errors.push(
      'Configure as quatro variáveis privadas de assinatura MEU_AGRO_KEYSTORE_PATH, MEU_AGRO_KEYSTORE_PASSWORD, MEU_AGRO_KEY_ALIAS e MEU_AGRO_KEY_PASSWORD.',
    );
  else if (!isAbsolute(env.MEU_AGRO_KEYSTORE_PATH) || !fileExists(env.MEU_AGRO_KEYSTORE_PATH))
    errors.push(
      'MEU_AGRO_KEYSTORE_PATH precisa apontar para um arquivo existente por caminho absoluto.',
    );
  if (
    /^androiddebugkey$/i.test(env.MEU_AGRO_KEY_ALIAS || '') ||
    /(?:^|[\\/])debug\.keystore$/i.test(env.MEU_AGRO_KEYSTORE_PATH || '')
  )
    errors.push('Use uma chave de distribuição, não a chave debug padrão do Android.');
  return errors;
}

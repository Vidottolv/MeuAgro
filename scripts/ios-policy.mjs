// Shared, platform-independent policy. No Xcode project files are edited here.
export function iosConfigurationProblems({ release, capacitor, packages }) {
  const problems = [];
  if (!/^\d+\.\d+\.\d+$/.test(release?.versionName || ''))
    problems.push('native/ios/release.json: versionName deve conter três números, como 0.36.0.');
  if (!/^[1-9]\d{0,3}(\.[0-9]{1,2}){0,2}$/.test(String(release?.buildNumber || '')))
    problems.push(
      'native/ios/release.json: buildNumber deve ser uma versão numérica Apple válida.',
    );
  if (capacitor?.appId !== 'com.meuagro.app')
    problems.push('O identificador do aplicativo deve permanecer com.meuagro.app.');
  if (capacitor?.server?.url || capacitor?.server?.cleartext === true)
    problems.push('Remova o servidor de desenvolvimento antes de preparar o pacote iOS.');
  const dependencies = packages?.dependencies || {};
  const version = dependencies['@capacitor/core'];
  if (
    !version ||
    dependencies['@capacitor/ios'] !== version ||
    dependencies['@capacitor/android'] !== version ||
    packages?.devDependencies?.['@capacitor/cli'] !== version
  )
    problems.push('Capacitor core, Android, iOS e CLI devem usar a mesma versão exata.');
  return problems;
}

export function configureIosInfoPlist(current, { release, appId }) {
  if (!current || Array.isArray(current) || typeof current !== 'object')
    throw Error('Info.plist não contém um dicionário válido.');
  if (
    current.NSAppTransportSecurity?.NSAllowsArbitraryLoads === true ||
    current.NSAppTransportSecurity?.NSAllowsArbitraryLoadsInWebContent === true
  )
    throw Error('Remova a liberação global de HTTP no Info.plist antes de continuar.');
  const urlTypes = current.CFBundleURLTypes || [];
  if (!Array.isArray(urlTypes)) throw Error('CFBundleURLTypes precisa ser uma lista.');
  return {
    ...current,
    CFBundleDisplayName: 'Meu Agro',
    CFBundleShortVersionString: release.versionName,
    CFBundleVersion: String(release.buildNumber),
    // Retain other integrations and replace only the entry owned by MeuAgro.
    CFBundleURLTypes: [
      ...urlTypes.filter((item) => item.CFBundleURLName !== `${appId}.auth`),
      {
        CFBundleURLName: `${appId}.auth`,
        CFBundleURLSchemes: ['meuagro'],
        CFBundleTypeRole: 'Editor',
      },
    ],
    NSCameraUsageDescription:
      'Fotografe a safra, os talhões e as observações da visita técnica para incluir nos seus registros.',
    NSPhotoLibraryUsageDescription:
      'Escolha fotos da sua biblioteca para acompanhar a safra e registrar visitas técnicas.',
    NSPhotoLibraryAddUsageDescription:
      'Permita salvar uma foto do Meu Agro na sua biblioteca quando você solicitar.',
  };
}

export function xcodeVersionSupported(output) {
  const match = /^Xcode (\d+)(?:\.(\d+))?/m.exec(output || '');
  return !!match && Number(match[1]) >= 26;
}

export function iosBuildEnvironmentProblems(env) {
  const problems = [];
  try {
    const url = new URL(env.VITE_SUPABASE_URL || '');
    if (
      url.protocol !== 'https:' ||
      url.hostname !== env.MEU_AGRO_EXPECTED_SUPABASE_HOST ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      !['', '/'].includes(url.pathname) ||
      /^(localhost|127\.|0\.|\[|\d+\.\d+\.\d+\.\d+$)/i.test(url.hostname)
    )
      throw Error();
  } catch {
    problems.push(
      'Configure VITE_SUPABASE_URL HTTPS e MEU_AGRO_EXPECTED_SUPABASE_HOST com o domínio exato do projeto.',
    );
  }
  const role = (value) => {
    try {
      return JSON.parse(Buffer.from(String(value).split('.')[1], 'base64url').toString()).role;
    } catch {
      return null;
    }
  };
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  if (!key.startsWith('sb_publishable_') && role(key) !== 'anon')
    problems.push(
      'Use apenas uma chave pública publishable ou anon em VITE_SUPABASE_PUBLISHABLE_KEY.',
    );
  if (
    Object.entries(env).some(
      ([name, value]) =>
        name.startsWith('VITE_') &&
        (/SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|ASAAS_API_KEY|COPERNICUS_CLIENT_SECRET/i.test(
          name,
        ) ||
          String(value).startsWith('sb_secret_') ||
          role(value) === 'service_role'),
    )
  )
    problems.push(
      'Remova credenciais privadas das variáveis VITE_: elas seriam incorporadas no aplicativo.',
    );
  return problems;
}

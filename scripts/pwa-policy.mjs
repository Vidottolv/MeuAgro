export function pwaBuildProblems(env, capacitor) {
  const problems = [];
  for (const [name, expectedHost] of [
    ['VITE_APP_URL', null],
    ['VITE_SUPABASE_URL', env.MEU_AGRO_EXPECTED_SUPABASE_HOST],
  ]) {
    try {
      const url = new URL(env[name] || '');
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.port ||
        url.search ||
        url.hash ||
        !['', '/'].includes(url.pathname) ||
        /^(localhost|127\.|0\.|\[|\d+\.\d+\.\d+\.\d+$)/i.test(url.hostname) ||
        (name === 'VITE_SUPABASE_URL' && (!expectedHost || expectedHost !== url.hostname))
      )
        throw Error();
    } catch {
      problems.push(
        name === 'VITE_APP_URL'
          ? 'Configure VITE_APP_URL com a origem HTTPS publicada, sem subpasta, parâmetros ou fragmentos.'
          : 'Confirme VITE_SUPABASE_URL HTTPS e MEU_AGRO_EXPECTED_SUPABASE_HOST com o domínio exato do projeto.',
      );
    }
  }
  const jwtRole = (key) => {
    try {
      return JSON.parse(Buffer.from(String(key).split('.')[1], 'base64url').toString()).role;
    } catch {
      return null;
    }
  };
  if (
    !(env.VITE_SUPABASE_PUBLISHABLE_KEY || '').startsWith('sb_publishable_') &&
    jwtRole(env.VITE_SUPABASE_PUBLISHABLE_KEY) !== 'anon'
  )
    problems.push(
      'VITE_SUPABASE_PUBLISHABLE_KEY precisa ser uma chave pública publishable ou anon.',
    );
  if (
    Object.entries(env).some(
      ([name, value]) =>
        name.startsWith('VITE_') &&
        (/SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|OPENAI.*KEY|ASAAS.*KEY|COPERNICUS.*SECRET/i.test(
          name,
        ) ||
          /^(sb_secret_|sk-)/.test(String(value)) ||
          jwtRole(value) === 'service_role'),
    )
  )
    problems.push('Remova credenciais privadas das variáveis VITE_: elas seriam públicas no PWA.');
  if (capacitor?.server?.url)
    problems.push('Remova o endereço de live reload antes de preparar uma distribuição.');
  return problems;
}

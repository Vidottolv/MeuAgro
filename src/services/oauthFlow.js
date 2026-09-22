// OAuth keeps its PKCE verifier separate from the existing e-mail flow.
export function verifierStorage(storage, key) {
  return {
    getItem: name => name === key + '-code-verifier' ? storage.getItem(name) : null,
    setItem: (name, value) => { if (name === key + '-code-verifier') storage.setItem(name, value); },
    removeItem: name => { if (name === key + '-code-verifier') storage.removeItem(name); },
  };
}
export function safeAuthDestination(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return '/dashboard';
  const url = new URL(value, 'https://meuagro.invalid');
  if (url.origin !== 'https://meuagro.invalid' || /^\/(auth(?:\/|$)|login|register|reset-password|forgot-password)/.test(url.pathname)) return '/dashboard';
  return url.pathname + url.search + url.hash;
}
export function createOAuthFlow({client, sessionClient, storage, key, projectUrl, redirectUrl, open, now = Date.now, random = () => crypto.randomUUID()}) {
  const pendingKey = key + '-pending';
  let starting = false, finishing = null;
  const read = () => { try { return JSON.parse(storage.getItem(pendingKey)); } catch { return null; } };
  const clear = attempt => {
    if (read()?.attempt !== attempt) return;
    storage.removeItem(pendingKey); storage.removeItem(key + '-code-verifier');
  };
  return {
    cancel() { if (!starting && !finishing) { const pending = read(); if (pending) clear(pending.attempt); } },
    async start(destination) {
      if (starting || finishing) throw new Error('Aguarde a tentativa de login em andamento.');
      starting = true;
      let attempt;
      try {
        const callback = new URL(redirectUrl()); attempt = random();
        callback.searchParams.set('flow', 'oauth'); callback.searchParams.set('attempt', attempt);
        storage.setItem(pendingKey, JSON.stringify({attempt, created:now(), destination:safeAuthDestination(destination)}));
        const {data, error} = await client.auth.signInWithOAuth({provider:'google', options:{redirectTo:callback.href, skipBrowserRedirect:true, queryParams:{prompt:'select_account'}}});
        if (error) throw error;
        const url = new URL(data?.url), project = new URL(projectUrl);
        if (url.origin !== project.origin || url.pathname !== project.pathname.replace(/\/$/,'') + '/auth/v1/authorize' || url.username || url.password || url.searchParams.get('provider') !== 'google' || url.searchParams.get('code_challenge_method') !== 's256' || !url.searchParams.get('code_challenge')) throw new Error('Não foi possível preparar o login seguro com Google.');
        await open(url.href);
      } catch (error) { if (attempt) clear(attempt); throw error; }
      finally { starting = false; }
    },
    finish(value) {
      if (finishing) return finishing;
      finishing = (async () => {
        const url = new URL(value), pending = read(), attempt = url.searchParams.get('attempt');
        if (!pending || !attempt || attempt !== pending.attempt) throw new Error('Inicie o login Google neste dispositivo e tente novamente.');
        try {
          if (!Number.isFinite(pending.created) || now() - pending.created > 600000 || now() < pending.created) throw new Error('A tentativa de login expirou. Toque novamente em Continuar com Google.');
          const hash = new URLSearchParams(url.hash.slice(1));
          if (url.searchParams.has('error') || hash.has('error')) throw new Error('O login Google não foi concluído. Você pode tentar novamente ou entrar com sua senha.');
          const code = url.searchParams.get('code');
          if (!code || hash.has('access_token') || hash.has('refresh_token')) throw new Error('Retorno do Google incompleto. Inicie uma nova tentativa de login.');
          const result = await client.auth.exchangeCodeForSession(code);
          if (result.error || !result.data?.session?.access_token || !result.data?.session?.refresh_token) throw new Error('Não foi possível concluir o login Google. Tente novamente neste dispositivo.');
          const {access_token, refresh_token} = result.data.session;
          const adopted = await sessionClient.auth.setSession({access_token, refresh_token});
          if (adopted.error || !adopted.data?.session) throw new Error('Não foi possível abrir sua sessão. Tente entrar novamente.');
          return safeAuthDestination(pending.destination);
        } finally { clear(attempt); }
      })().finally(() => { finishing = null; });
      return finishing;
    },
  };
}

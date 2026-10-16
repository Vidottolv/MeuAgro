// Only producer GET requests are cached. Auth, RPCs and commercial data never are.
const tables = new Set([
  'profiles',
  'properties',
  'areas',
  'area_types',
  'seasons',
  'crops',
  'production_cycles',
  'production_events',
  'event_photos',
  'agricultural_inputs',
  'technical_visits',
  'technical_visit_photos',
]);
export function createCachedFetch({
  store,
  origin,
  currentUser,
  online,
  fetcher = globalThis.fetch.bind(globalThis),
  stale = () => {},
  strict = () => false,
}) {
  return async (input, options) => {
    const request = new Request(input, options),
      url = new URL(request.url);
    const table = url.pathname.replace(/^\/rest\/v1\//, '');
    const user = currentUser();
    const cacheable =
      user &&
      url.origin === origin &&
      ['GET', 'HEAD'].includes(request.method) &&
      tables.has(table) &&
      (!table.startsWith('technical_visit') || url.searchParams.get('author_id') === `eq.${user}`);
    if (!cacheable) {
      if (!online()) throw Error('Esta ação precisa de conexão com a internet.');
      return fetcher(request);
    }
    const variant = ['accept', 'range', 'range-unit', 'prefer', 'accept-profile']
      .map((h) => request.headers.get(h) || '')
      .join('|');
    const key = `${user}:read:${request.method}:${request.url}:${variant}`;
    let response;
    if (online()) {
      try {
        response = await fetcher(request);
      } catch (error) {
        if (request.signal.aborted || error?.name === 'AbortError') throw error;
      }
    }
    if (user !== currentUser()) throw Error('A conta mudou. Abra a página novamente.');
    if (response) {
      if (response.ok) {
        try {
          await store.batch([
            [
              key,
              {
                body: await response.clone().text(),
                status: response.status,
                headers: [...response.headers],
                savedAt: Date.now(),
              },
            ],
          ]);
        } catch (error) {
          if (strict())
            throw Error(
              'Não foi possível preparar o armazenamento local. Libere espaço no dispositivo e tente novamente.',
            );
        }
      } else if (response.status === 401 || response.status === 403) {
        await store.batch([], [key]);
      }
      return response; // Never hide server permission/validation errors with stale data.
    }
    if (strict())
      throw Error(
        'A conexão falhou durante o preparo. Tente novamente antes de sair para o campo.',
      );
    const cached = await store.get(key);
    if (!cached)
      throw Error(
        'Dados indisponíveis offline. Conecte-se e prepare os dados de campo em Configurações.',
      );
    stale(cached.savedAt);
    return new Response(request.method === 'HEAD' ? null : cached.body, {
      status: cached.status,
      headers: cached.headers,
    });
  };
}

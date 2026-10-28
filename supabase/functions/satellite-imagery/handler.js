import {
  sceneSearchRequest,
  sceneSearchResult,
  API,
  TOKEN,
  imageSpec,
  catalogRequest,
  selectScene,
  processRequest,
  processingUnits,
} from './provider.js';
const uuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function createSatelliteHandler({ env, userClient, adminClient, fetcher = fetch }) {
  let cachedToken = null,
    tokenUntil = 0,
    tokenPromise;
  async function accessToken() {
    if (cachedToken && Date.now() < tokenUntil) return cachedToken;
    if (tokenPromise) return tokenPromise;
    tokenPromise = (async () => {
      const response = await fetcher(TOKEN, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: env('COPERNICUS_CLIENT_ID'),
          client_secret: env('COPERNICUS_CLIENT_SECRET'),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw Object.assign(Error('Credenciais Copernicus recusadas.'), {
          providerStatus: response.status,
        });
      const body = await response.json();
      if (!body.access_token) throw Error('Autenticação do provedor indisponível.');
      cachedToken = body.access_token;
      tokenUntil = Date.now() + Math.max(0, Number(body.expires_in || 60) - 30) * 1000;
      return cachedToken;
    })().finally(() => {
      tokenPromise = null;
    });
    return tokenPromise;
  }
  return async (request) => {
    const origin = request.headers.get('origin');
    const allowed = (
      env('SATELLITE_ALLOWED_ORIGINS') ||
      'http://localhost:5173,http://localhost,https://localhost,capacitor://localhost'
    )
      .split(',')
      .map((s) => s.trim());
    const headers = {
      'cache-control': 'no-store',
      vary: 'Origin',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info',
    };
    if (origin && !allowed.includes(origin))
      return Response.json({ error: 'Origem não autorizada.' }, { status: 403, headers });
    if (origin) headers['access-control-allow-origin'] = origin;
    const json = (body, status = 200) => Response.json(body, { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer '))
      return json({ error: 'Entre novamente na sua conta.' }, 401);
    let user,
      admin,
      job = null,
      requests = 0,
      spent = 0,
      known = true,
      searchJob = null,
      searchAttempted = false,
      stage = 'validation',
      providerStatus = null;
    const rpc = async (client, name, args) => {
      const result = await client.rpc(name, args);
      if (result.error) throw Error(result.error.message);
      return result.data;
    };
    async function finish(status, metadata) {
      await rpc(admin, 'satellite_image_finish', {
        p_id: job.id,
        p_lease: job.lease,
        p_status: status,
        p_metadata: { ...metadata, observed_pu_lower_bound: spent },
        p_requests: requests,
        p_pu: known ? spent : null,
      });
    }
    try {
      const raw = await request.text();
      if (raw.length > 2048) return json({ error: 'Requisição muito grande.' }, 400);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return json({ error: 'Requisição inválida.' }, 400);
      }
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return json({ error: 'Requisição inválida.' }, 400);
      user = userClient(authorization);
      const auth = await user.auth.getUser(authorization.slice(7));
      if (auth.error || !auth.data?.user)
        return json({ error: 'Sessão inválida. Entre novamente.' }, 401);
      admin = adminClient();
      if (body.action === 'view') {
        if (!uuid(body.id) || (body.share_id && !uuid(body.share_id)))
          return json({ error: 'Imagem inválida.' }, 400);
        const args = { p_id: body.id, p_share: body.share_id || null };
        const access = await rpc(user, 'satellite_image_access', args);
        const download = await admin.storage
          .from('meuagro-satellite')
          .download(access.storage_path);
        if (download.error || !download.data) throw Error('Imagem indisponível no armazenamento.');
        await rpc(user, 'satellite_image_access', args);
        return new Response(download.data, {
          headers: { ...headers, 'content-type': 'application/octet-stream' },
        });
      }
      if (body.action === 'search') {
        if (
          !uuid(body.area_id) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(body.from || '') ||
          !/^\d{4}-\d{2}-\d{2}$/.test(body.to || '')
        )
          return json({ error: 'Informe talhão e intervalo válidos.' }, 400);
        if (
          env('SATELLITE_ENABLED') !== 'true' ||
          !env('COPERNICUS_CLIENT_ID') ||
          !env('COPERNICUS_CLIENT_SECRET')
        )
          return json({ error: 'Configure e habilite o piloto Copernicus.' }, 503);
        searchJob = await rpc(admin, 'satellite_search_claim', {
          p_user: auth.data.user.id,
          p_area: body.area_id,
          p_from: body.from,
          p_to: body.to,
        });
        if (!searchJob.claimed) return json({ ...searchJob, cached: true });
        stage = 'authentication';
        const token = await accessToken();
        stage = 'catalog';
        searchAttempted = true;
        known = false;
        const response = await fetcher(API + '/catalog/v1/search', {
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + token,
            'content-type': 'application/json',
            accept: 'application/geo+json',
          },
          body: JSON.stringify(sceneSearchRequest(searchJob.geometry, body.from, body.to)),
          signal: AbortSignal.timeout(25000),
        });
        providerStatus = response.status;
        const units = processingUnits(response);
        spent = units || 0;
        known = units !== null;
        if (!response.ok) throw Error('Catálogo indisponível.');
        const result = sceneSearchResult(await response.json(), body.from, body.to);
        await rpc(admin, 'satellite_search_finish', {
          p_id: searchJob.id,
          p_lease: searchJob.lease,
          p_status: 'ready',
          p_result: { ...result, actual_requests: 1, observed_pu_lower_bound: spent },
          p_pu: units,
        });
        return json({ id: searchJob.id, status: 'ready', result, cached: false });
      }
      if (
        body.action !== 'process' ||
        !uuid(body.area_id) ||
        !['rgb', 'ndvi'].includes(body.layer) ||
        typeof body.day !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body.day)
      )
        return json({ error: 'Informe talhão, data e camada válidos.' }, 400);
      if (
        env('SATELLITE_ENABLED') !== 'true' ||
        !env('COPERNICUS_CLIENT_ID') ||
        !env('COPERNICUS_CLIENT_SECRET')
      )
        return json(
          { error: 'Configure e habilite o piloto Copernicus nos segredos do Supabase.' },
          503,
        );
      // The caller ID comes only from getUser, never from a body parameter.
      if (
        body.search_id &&
        (!uuid(body.search_id) || typeof body.scene_id !== 'string' || body.scene_id.length > 250)
      )
        return json({ error: 'Cena inválida.' }, 400);
      job = await rpc(
        admin,
        body.search_id ? 'satellite_scene_image_claim' : 'satellite_image_claim',
        {
          p_user: auth.data.user.id,
          p_area: body.area_id,
          ...(body.search_id
            ? { p_search: body.search_id, p_scene: body.scene_id }
            : { p_day: body.day }),
          p_layer: body.layer,
        },
      );
      if (!job.claimed)
        return json({ id: job.id, status: job.status, cached: true, metadata: job.metadata });
      stage = 'authentication';
      const token = await accessToken(),
        spec = imageSpec(job.geometry);
      stage = 'catalog';
      const call = async (url, payload) => {
        requests++;
        const previouslyKnown = known;
        known = false;
        const response = await fetcher(url, {
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + token,
            'content-type': 'application/json',
            accept: url.endsWith('/process/v1') ? 'image/png' : 'application/geo+json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(25000),
        });
        providerStatus = response.status;
        const units = processingUnits(response);
        if (units !== null) {
          spent += units;
          known = previouslyKnown;
        } else known = false;
        if (!response.ok)
          throw Error(
            response.status === 429
              ? 'Limite do provedor atingido. Tente outra data após revisão da franquia.'
              : 'O provedor não concluiu a consulta. Revise a configuração do piloto.',
          );
        return response;
      };
      let scene = job.scene;
      if (!scene) {
        const catalog = await call(
          API + '/catalog/v1/search',
          catalogRequest(job.geometry, body.day),
        );
        scene = selectScene(await catalog.json(), body.day);
      }
      if (!scene) {
        await finish('no_data', {
          message:
            'Nenhuma cena elegível encontrada nesta consulta (até 10 cenas; máximo de 30% de nuvens na cena).',
          searched_at: new Date().toISOString(),
        });
        return json({ id: job.id, status: 'no_data' });
      }
      stage = 'processing';
      providerStatus = null;
      const png = await call(API + '/process/v1', processRequest(spec, scene, body.layer));
      if (!png.headers.get('content-type')?.includes('image/png'))
        throw Error('O provedor retornou um formato inesperado.');
      const bytes = new Uint8Array(await png.arrayBuffer());
      if (
        bytes.length < 8 ||
        bytes.length > 2097152 ||
        bytes.slice(0, 8).join(',') !== '137,80,78,71,13,10,26,10'
      )
        throw Error('Imagem inválida ou acima do limite do piloto.');
      const path = auth.data.user.id + '/' + job.id + '.png';
      stage = 'storage';
      providerStatus = null;
      const upload = await admin.storage
        .from('meuagro-satellite')
        .upload(path, bytes, { contentType: 'image/png', upsert: false, cacheControl: '0' });
      if (upload.error) throw Error('Não foi possível guardar a imagem processada.');
      const metadata = {
        bounds: spec.bounds,
        width: spec.width,
        height: spec.height,
        resolution_m: spec.resolution_m,
        reference_scene: scene.id,
        acquisition_at: scene.properties.datetime,
        scene_cloud_percent: scene.properties['eo:cloud_cover'],
        source: 'Sentinel-2 L2A / Copernicus',
        algorithm: 's2-v1',
        cloud_mask: 'SCL: classes 4, 5 e 6; demais pixels transparentes',
      };
      stage = 'finalization';
      await finish('ready', metadata);
      return json({ id: job.id, status: 'ready', metadata, cached: false });
    } catch (error) {
      // Only fixed stage names and numeric HTTP codes; never provider bodies or credentials.
      const diagnostic = {
        stage,
        provider_http_status: Number.isInteger(error.providerStatus)
          ? error.providerStatus
          : providerStatus,
        failure_kind: ['TimeoutError', 'AbortError'].includes(error.name)
          ? 'timeout'
          : 'request_failed',
      };
      if (searchJob?.claimed) {
        try {
          await rpc(admin, 'satellite_search_finish', {
            p_id: searchJob.id,
            p_lease: searchJob.lease,
            p_status: 'failed',
            p_result: {
              ...diagnostic,
              actual_requests: searchAttempted ? 1 : 0,
              observed_pu_lower_bound: spent,
            },
            p_pu: known ? spent : null,
          });
        } catch {
          /* Preserve pending search; no automatic retry. */
        }
        return json(
          {
            error:
              'Falha na busca: ' +
              stage +
              (diagnostic.provider_http_status
                ? ' (HTTP ' + diagnostic.provider_http_status + ')'
                : '') +
              '. A reserva foi preservada.',
          },
          502,
        );
      }
      if (job?.claimed) {
        try {
          await finish('failed', {
            ...diagnostic,
            message:
              'Processamento não concluído. A reserva foi preservada; não haverá repetição automática.',
          });
        } catch {
          /* May remain processing after a lost response; never claim again automatically. */
        }
      }
      return json(
        {
          error: job?.claimed
            ? `Falha na etapa ${stage}${diagnostic.provider_http_status ? ' (HTTP ' + diagnostic.provider_http_status + ')' : ''}. A reserva foi preservada; consulte o diagnóstico no histórico.`
            : error.message || 'Consulta indisponível.',
        },
        job?.claimed ? 502 : 400,
      );
    }
  };
}

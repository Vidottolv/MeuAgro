export function normalizeForecast(data) {
  const keys = [
    'time',
    'temperature_2m_min',
    'temperature_2m_max',
    'precipitation_sum',
    'wind_speed_10m_max',
  ];
  const daily = data?.daily;
  if (
    !daily ||
    !keys.every((k) => Array.isArray(daily[k]) && daily[k].length === 7) ||
    typeof data.timezone !== 'string' ||
    data.timezone.length > 100
  )
    throw Error('Resposta meteorológica inválida.');
  return {
    source: 'Open-Meteo',
    timezone: data.timezone,
    days: daily.time.map((day, i) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('Data meteorológica inválida.');
      const values = keys.slice(1).map((k) => daily[k][i]);
      if (
        values.some(
          (v) =>
            v !== null && (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 10000),
        )
      )
        throw Error('Valores meteorológicos inválidos.');
      return { day, min: values[0], max: values[1], rain: values[2], wind: values[3] };
    }),
  };
}
export function createWeatherHandler({ env, userClient, adminClient, fetcher = fetch }) {
  return async (request) => {
    const origin = request.headers.get('origin') || '',
      allowed = (env('APP_ALLOWED_ORIGINS') || '').split(',').map((s) => s.trim());
    const headers = {
      'content-type': 'application/json',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-allow-methods': 'POST, OPTIONS',
      ...(allowed.includes(origin) ? { 'access-control-allow-origin': origin } : {}),
    };
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    if (origin && !allowed.includes(origin)) return reply({ error: 'Origem não autorizada.' }, 403);
    if (request.method === 'OPTIONS') return reply({});
    if (request.method !== 'POST') return reply({ error: 'Método inválido.' }, 405);
    let admin, job;
    try {
      const client = userClient(request.headers.get('authorization') || '');
      const { data: auth, error } = await client.auth.getUser();
      if (error || !auth.user) return reply({ error: 'Entre na sua conta.' }, 401);
      if (env('WEATHER_ENABLED') !== 'true' || !env('OPEN_METEO_API_KEY'))
        return reply(
          {
            error:
              'Previsão ainda não ativada pelo administrador. O registro de chuva continua disponível.',
          },
          503,
        );
      if (Number(request.headers.get('content-length') || 0) > 2000)
        return reply({ error: 'Solicitação inválida.' }, 400);
      const body = await request.json();
      if (typeof body.property_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.property_id))
        return reply({ error: 'Propriedade inválida.' }, 400);
      const { data: prepared, error: failure } = await client.rpc('weather_prepare', {
        p_property: body.property_id,
      });
      if (failure) return reply({ error: failure.message }, 400);
      if (prepared.cached) return reply(prepared);
      job = prepared.id;
      admin = adminClient();
      const url = new URL('https://customer-api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({
        latitude: String(prepared.latitude),
        longitude: String(prepared.longitude),
        daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: '7',
        wind_speed_unit: 'kmh',
        apikey: env('OPEN_METEO_API_KEY'),
      }).toString();
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });
      if (!response.ok) throw Error('provider');
      const text = await response.text();
      if (text.length > 100000) throw Error('size');
      const data = normalizeForecast(JSON.parse(text));
      const saved = await admin.rpc('weather_complete', { p_job: job, p_data: data });
      if (saved.error) throw Error('storage');
      return reply({ cached: false, data, fetched_at: new Date().toISOString() });
    } catch {
      if (admin && job)
        await admin.rpc('weather_complete', { p_job: job, p_data: null }).catch(() => {});
      return reply(
        { error: 'Não foi possível atualizar a previsão. Tente novamente após dez minutos.' },
        502,
      );
    }
  };
}

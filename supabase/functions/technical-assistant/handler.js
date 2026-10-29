import { generateVisitDraft } from './provider.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createAssistantHandler({
  env,
  userClient,
  adminClient,
  generate = generateVisitDraft,
}) {
  return async (request) => {
    const origin = request.headers.get('origin');
    const allowed = (
      env('AI_ALLOWED_ORIGINS') ||
      'http://localhost:5173,http://localhost,https://localhost,capacitor://localhost'
    )
      .split(',')
      .map((s) => s.trim());
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
      'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      ...(origin && allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
    if (origin && !allowed.includes(origin)) return reply(403, { error: 'Origem não autorizada.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
    let claim,
      admin,
      finished = false;
    try {
      const auth = request.headers.get('authorization');
      if (!auth?.startsWith('Bearer ')) return reply(401, { error: 'Entre na sua conta.' });
      const user = userClient(auth);
      const { data: identity, error: authError } = await user.auth.getUser();
      if (authError || !identity?.user?.id) return reply(401, { error: 'Sessão inválida.' });
      // Stream-bound the request instead of trusting Content-Length.
      const reader = request.body?.getReader();
      let bytes = 0,
        chunks = [];
      if (!reader) return reply(400, { error: 'Informe a visita.' });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > 2048) {
          await reader.cancel();
          return reply(413, { error: 'Pedido extenso demais.' });
        }
        chunks.push(value);
      }
      const joined = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        joined.set(chunk, offset);
        offset += chunk.length;
      }
      const body = JSON.parse(new TextDecoder().decode(joined));
      if (
        body.action !== 'generate' ||
        body.consent !== true ||
        !uuid.test(body.visit_id || '') ||
        !/^[a-f0-9]{32}$/.test(body.source_hash || '') ||
        Object.keys(body).some((k) => !['action', 'consent', 'visit_id', 'source_hash'].includes(k))
      )
        return reply(400, { error: 'Confira o texto e autorize o envio antes de gerar.' });
      const { data: context, error: contextError } = await user.rpc('visit_ai_context', {
        p_visit: body.visit_id,
      });
      if (contextError)
        return reply(403, {
          error: 'Visita indisponível para este assistente. Confira a etapa 58 e seu acesso.',
        });
      if (context.source_hash !== body.source_hash)
        return reply(409, { error: 'A visita mudou. Atualize e confira o texto novamente.' });
      if (env('AI_ENABLED') !== 'true' || !env('OPENAI_API_KEY'))
        return reply(503, { error: 'Assistente ainda não ativado no servidor.' });
      admin = adminClient();
      const reserved = await admin.rpc('visit_ai_claim', {
        p_user: identity.user.id,
        p_visit: body.visit_id,
        p_hash: body.source_hash,
      });
      if (reserved.error)
        return reply(409, { error: reserved.error.message || 'Análise não autorizada.' });
      claim = reserved.data;
      if (claim.claimed) {
        const output = await generate({
          source: claim.source,
          model: claim.model,
          apiKey: env('OPENAI_API_KEY'),
        });
        const saved = await admin.rpc('visit_ai_finish', {
          p_id: claim.id,
          p_lease: claim.lease,
          p_result: output.result,
          p_input: output.input,
          p_output: output.output,
        });
        if (saved.error) {
          const error = new Error('Não foi possível registrar a conclusão.');
          error.kind = 'persist_failed';
          throw error;
        }
        finished = true;
      }
      const check = await user.rpc('visit_ai_context', { p_visit: body.visit_id });
      if (check.error) return reply(403, { error: 'Acesso à visita alterado. Atualize a tela.' });
      return reply(200, {
        id: claim.id,
        status: claim.claimed ? 'ready' : claim.status,
        cached: !claim.claimed,
      });
    } catch (error) {
      const kind =
        /^(provider_http_[1-5][0-9]{2}|invalid_response|incomplete|refused|persist_failed)$/.test(
          error.kind || '',
        )
          ? error.kind
          : 'request_failed';
      console.warn('technical-assistant:', kind); // Codes only: no prompt, result, user or key.
      if (claim?.claimed && !finished) {
        try {
          await admin.rpc('visit_ai_finish', {
            p_id: claim.id,
            p_lease: claim.lease,
            p_result: null,
            p_input: error.usage?.input ?? null,
            p_output: error.usage?.output ?? null,
          });
        } catch {}
      }
      return reply(502, {
        error:
          'Não foi possível concluir a análise. Confira o histórico. A reserva é mantida e não há repetição automática.',
      });
    }
  };
}

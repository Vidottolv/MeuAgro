const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  const { visitAiFixture } = await import('../visit-ai-fixture.mjs');
  const { createAssistantHandler } =
    await import('../../supabase/functions/technical-assistant/handler.js');
  const f = await visitAiFixture(),
    visit = await f.visit(5),
    uid = f.ids[4];
  await f.as(5);
  const row = (await f.db.query('select * from technical_visits where id=$1', [visit])).rows[0];
  let calls = 0,
    queue = Promise.resolve(),
    release = null,
    hold = false;
  const errors = [],
    root = path.resolve(process.env.VISIT_TEST_DIST || 'dist');
  const server = createServer(async (req, res) => {
    try {
      let p = new URL(req.url, 'http://localhost').pathname;
      if (!path.extname(p)) p = '/index.html';
      const file = path.resolve(root, '.' + p);
      if (!file.startsWith(root + path.sep)) throw Error();
      res.writeHead(200, {
        'Content-Type':
          { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[
            path.extname(file)
          ] || 'application/octet-stream',
      });
      res.end(await fs.readFile(file));
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((done) => server.listen(4187, '127.0.0.1', done));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const user = {
    id: uid,
    email: 'test@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    user_metadata: { full_name: 'Técnico Teste' },
  };
  const token =
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url') +
    '.' +
    Buffer.from(
      JSON.stringify({
        sub: uid,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url') +
    '.test';
  const session = {
    user,
    access_token: token,
    refresh_token: 'test',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  };
  const rpc = async (name, args, service = false) => {
    try {
      await f.as(service ? null : 5, service ? 'service_role' : 'authenticated');
      return { data: await f.rpc(name, args) };
    } catch (e) {
      return { error: { message: e.message, code: e.code } };
    }
  };
  const handler = createAssistantHandler({
    env: (k) => ({ AI_ENABLED: 'true', OPENAI_API_KEY: 'mock' })[k],
    userClient: () => ({
      auth: { getUser: async () => ({ data: { user } }) },
      rpc: (name, b) => rpc(name, [b.p_visit]),
    }),
    adminClient: () => ({
      rpc: (name, b) =>
        rpc(
          name,
          name === 'visit_ai_claim'
            ? [b.p_user, b.p_visit, b.p_hash]
            : [b.p_id, b.p_lease, b.p_result, b.p_input, b.p_output],
          true,
        ),
    }),
    generate: async () => {
      calls++;
      return {
        result: {
          summary: 'Rascunho de teste: relato precisa de conferência.',
          questions: ['Quando surgiram os sintomas?'],
          attention_points: ['Conferir em campo.'],
          next_steps: ['Registrar evolução.'],
          limitations: ['Sem diagnóstico confirmado.'],
        },
        input: 200,
        output: 100,
      };
    },
  });
  await context.route('http://127.0.0.1:54321/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      };
    if (req.method() === 'OPTIONS') return route.fulfill({ headers, body: '{}' });
    const job = queue.then(async () => {
      let data = [],
        status = 200;
      if (url.pathname === '/auth/v1/user') data = user;
      else if (url.pathname === '/auth/v1/token') data = session;
      else if (url.pathname.includes('/functions/v1/technical-assistant')) {
        const response = await handler(
          new Request('https://edge.test', {
            method: 'POST',
            headers: { Authorization: 'Bearer mock' },
            body: req.postData(),
          }),
        );
        status = response.status;
        data = await response.json();
      } else if (url.pathname.includes('/rpc/visit_ai_')) {
        const name = url.pathname.split('/').pop(),
          b = req.postDataJSON();
        const r = await rpc(
          name,
          name === 'visit_ai_context' ? [b.p_visit] : [b.p_id, b.p_confirm],
        );
        if (r.error) {
          status = 403;
          data = r.error;
        } else data = r.data;
        if (hold && name === 'visit_ai_context') await new Promise((done) => (release = done));
      } else if (url.pathname === '/rest/v1/technical_visits') data = [row];
      await route.fulfill({ status, headers, body: JSON.stringify(data) });
    });
    queue = job.catch(() => {});
    await job;
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    (s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)),
    session,
  );
  try {
    await page.goto('http://127.0.0.1:4187/more/visits?id=' + visit);
    const panel = page.getByRole('region', { name: 'Apoio de IA à visita' });
    await panel.getByText('Reserva mensal de análises:', { exact: false }).waitFor();
    assert.equal(calls, 0);
    const generate = panel.getByRole('button', { name: 'Gerar apoio de IA', exact: true });
    assert(await generate.isDisabled());
    await panel.getByText('Conferir o texto que será enviado à OpenAI', { exact: true }).click();
    await panel.locator('.ai-preview').getByText('Observação privada', { exact: true }).waitFor();
    await panel.getByRole('checkbox', { name: /autorizo/ }).check();
    await generate.click();
    await panel.getByRole('heading', { name: 'Rascunho de IA — confira antes de usar' }).waitFor();
    assert.equal(calls, 1);
    await panel.getByRole('checkbox', { name: /Conferi este rascunho/ }).check();
    await panel.getByRole('button', { name: 'Registrar minha revisão' }).click();
    await panel.getByText(/Revisão registrada pelo usuário/).waitFor();
    await page.screenshot({ path: '../work/visit-ai-mobile.png', fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await panel.getByRole('button', { name: 'Atualizar disponibilidade e histórico' }).click();
    await panel.getByText(/Revisão registrada pelo usuário/).waitFor();
    assert.equal(calls, 1);
    // A late response must not restore sensitive AI text after going offline.
    hold = true;
    await panel.getByRole('button', { name: 'Atualizar disponibilidade e histórico' }).click();
    await page.waitForFunction(() =>
      document.body.innerText.includes('Consultando disponibilidade'),
    );
    await context.setOffline(true);
    await panel.getByText(/Conecte-se para consultar o assistente/).waitFor();
    if (release) release();
    await queue;
    assert.equal(await panel.getByText(/Rascunho de teste:/).count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      'IA móvel: consentimento, geração, revisão, cache e invalidação offline conferidos. Nenhuma API externa chamada.',
    );
  } finally {
    if (release) release();
    await browser.close();
    await new Promise((done) => server.close(done));
    await f.db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

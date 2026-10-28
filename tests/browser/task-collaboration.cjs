const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(process.env.VISIT_TEST_DIST || 'dist');
const uid = '11111111-1111-4111-8111-111111111111',
  pid = '22222222-2222-4222-8222-222222222222',
  aid = '33333333-3333-4333-8333-333333333333',
  cid = '44444444-4444-4444-8444-444444444444',
  cropid = '55555555-5555-4555-8555-555555555555';
const property = {
  id: pid,
  user_id: uid,
  name: 'Sítio Horizonte',
  status: 'active',
  deleted_at: null,
};
const area = {
  id: aid,
  user_id: uid,
  property_id: pid,
  name: 'Talhão Norte',
  deleted_at: null,
  status: 'active',
};
const crop = { id: cropid, name: 'Milho', is_system: true, active: true };
const cycle = {
  id: cid,
  user_id: uid,
  property_id: pid,
  area_id: aid,
  crop_id: cropid,
  property,
  area,
  crop,
  status: 'planted',
  deleted_at: null,
  planting_date: '2026-10-01',
};
const user = {
  id: uid,
  email: 'tecnico@example.test',
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: { full_name: 'Técnico Teste' },
};
const token =
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
  '.' +
  Buffer.from(
    JSON.stringify({ sub: uid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString('base64url') +
  '.test';
const session = {
  user,
  access_token: token,
  refresh_token: 'test-refresh',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
};
const comments = [];
const tasks = [],
  taskEvents = [],
  taskOperations = new Map();
const visits = [],
  photos = [],
  committed = new Map(),
  errors = [];
const server = createServer(async (req, res) => {
  try {
    let p = new URL(req.url, 'http://localhost').pathname;
    if (!extname(p)) p = '/index.html';
    const file = resolve(root, '.' + p);
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type':
        { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ||
        'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
(async () => {
  await new Promise((done) => server.listen(4184, '127.0.0.1', done));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('http://127.0.0.1:54321/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        headers = {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers, body: '{}' });
      let data = [];
      if (url.pathname === '/auth/v1/user') data = user;
      else if (url.pathname === '/auth/v1/token') data = session;
      else if (url.pathname.includes('/rpc/technical_task_')) {
        const name = url.pathname.split('/').at(-1),
          body = req.postDataJSON();
        if (name === 'technical_task_context')
          data = {
            collaboration_version: 40,
            can_create: true,
            can_assign: false,
            next_visit: '2026-10-25',
            people: [{ id: uid, name: 'Técnico Teste' }],
          };
        if (name === 'technical_task_list')
          data = {
            items: tasks.filter((t) => !body.p_visit || t.visit_id === body.p_visit),
            truncated: false,
          };
        if (name === 'technical_task_comment_list')
          data = comments
            .filter((c) => c.task_id === body.p_id)
            .slice()
            .reverse();
        if (name === 'technical_task_history')
          data = taskEvents
            .filter((e) => e.task_id === body.p_id)
            .slice()
            .reverse();
        if (name === 'technical_task_command') {
          if (taskOperations.has(body.p_operation)) data = taskOperations.get(body.p_operation);
          else {
            const d = body.p_data;
            if (body.p_action === 'create')
              tasks.push({
                ...d,
                id: body.p_operation,
                created_by: uid,
                assigned_name: 'Técnico Teste',
                seller_id: null,
                site_name: 'Sítio Horizonte',
                area_name: 'Talhão Norte',
                producer_name: 'Produtor João',
                status: 'pending',
                outcome: '',
                version: 1,
                can_edit: true,
                can_assign: false,
                can_open_visit: true,
              });
            else {
              const row = tasks.find((t) => t.id === d.id);
              if (body.p_action === 'check') {
                row.checklist.find((i) => i.id === d.item_id).done = d.done;
                row.version++;
              } else if (body.p_action === 'comment') {
                comments.push({
                  id: body.p_operation,
                  task_id: row.id,
                  author_id: uid,
                  author_name: 'Técnico Teste',
                  body: d.body,
                  created_at: new Date().toISOString(),
                });
              } else Object.assign(row, d, { version: row.version + 1 });
            }
            const task = tasks.find(
              (t) => t.id === (body.p_action === 'create' ? body.p_operation : d.id),
            );
            taskEvents.push({
              id: taskEvents.length + 1,
              task_id: task.id,
              action: body.p_action,
              created_at: new Date().toISOString(),
              snapshot: { ...task, ...(body.p_action === 'comment' ? { comment: d.body } : {}) },
            });
            data = { id: task.id, version: task.version };
            taskOperations.set(body.p_operation, data);
          }
        }
      } else if (url.pathname.endsWith('/rpc/sync_visit_operation')) {
        const body = req.postDataJSON(),
          p = body.p_payload;
        if (!committed.has(body.p_operation)) {
          committed.set(body.p_operation, p);
          if (p.visit) visits.push(p.visit);
          if (p.photos) photos.push(...p.photos);
          if (p.kind === 'visit_photo') photos.push(p.photo);
        }
        data = { id: body.p_operation, synced: true };
      } else if (url.pathname.startsWith('/storage/v1/object/')) data = { Key: 'uploaded' };
      else {
        const table = url.pathname.split('/').at(-1);
        data =
          {
            properties: [property],
            areas: [area],
            crops: [crop],
            production_cycles: [cycle],
            technical_visits: visits,
            technical_visit_photos: photos,
          }[table] || [];
        for (const field of ['id', 'visit_id', 'author_id'])
          if (url.searchParams.get(field)?.startsWith('eq.'))
            data = data.filter((row) => row[field] === url.searchParams.get(field).slice(3));
        if (req.method() === 'HEAD') {
          headers['content-range'] = '*/' + data.length;
          data = null;
        }
      }
      await route.fulfill({
        status: 200,
        headers,
        body: data === null ? '' : JSON.stringify(data),
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((session) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
        sessionStorage.setItem('seeded', '1');
      }
    }, session);
    await page.goto('http://127.0.0.1:4184/more/settings');
    await page.getByRole('heading', { name: 'Uso offline e sincronização' }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
    await page.getByRole('button', { name: 'Preparar dados de campo', exact: true }).click();
    await page.getByText('Dados de campo preparados neste dispositivo.', { exact: true }).waitFor();
    console.log(
      'PASS: offline preparation includes personal visit history and required field context',
    );
    await context.setOffline(true);
    await page.goto('http://127.0.0.1:4184/more/visits?new=1');
    await page.locator('#visit-producer').fill('Produtor João');
    await page.locator('#visit-property').selectOption(pid);
    await page.locator('#visit-area option[value="' + aid + '"]').waitFor({ state: 'attached' });
    await page.locator('#visit-area').selectOption(aid);
    await page.locator('#visit-crop').selectOption(cropid);
    await page.locator('#visit-cycle').selectOption(cid);
    await page.locator('#visit-reason').fill('Manchas nas folhas do milho');
    await page
      .locator('#visit-producer_report')
      .fill('O produtor observou o problema há três dias.');
    await page.locator('#visit-symptoms').fill('Lesões nas folhas do talhão norte.');
    await page.locator('#visit-next').fill('2027-01-06');
    await page
      .locator('#visit-recommendations')
      .fill('Coleta de amostras e acompanhamento combinado.');
    await page.locator('input[type=file]').setInputFiles({
      name: 'folha.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6bW8AAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await page.getByLabel('Legenda da foto 1', { exact: true }).fill('Folha com manchas');
    await page.getByRole('button', { name: 'Salvar rascunho agora', exact: true }).click();
    await page.getByText(/Rascunho salvo neste dispositivo em/).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Continuar rascunho', exact: true }).click();
    assert.equal(await page.locator('#visit-producer').inputValue(), 'Produtor João');
    assert.equal(
      await page.locator('#visit-symptoms').inputValue(),
      'Lesões nas folhas do talhão norte.',
    );
    assert.equal(
      await page.getByLabel('Legenda da foto 1', { exact: true }).inputValue(),
      'Folha com manchas',
    );
    assert.equal(
      await page.getByRole('img', { name: 'Prévia da foto anexada', exact: true }).count(),
      1,
    );
    console.log('PASS: draft fields, photo and caption recovered after offline reload');
    await page.getByRole('button', { name: 'Registrar anamnese', exact: true }).click();
    await page.getByRole('heading', { name: 'Ficha de visita técnica', exact: true }).waitFor();
    await page.getByText('Salva neste dispositivo • aguardando envio', { exact: true }).waitFor();
    await page.getByRole('img', { name: 'Folha com manchas', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.reload();
    await page.getByText('Manchas nas folhas do milho', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Visualizar relatório', exact: true }).click();
    const report = page.getByRole('dialog', { name: 'MeuAgro — Relatório de visita técnica' });
    await report.waitFor();
    await report.getByText('Produtor João', { exact: true }).waitFor();
    await report
      .getByText('Pendente de sincronização — salvo neste dispositivo.', { exact: true })
      .waitFor();
    assert.equal(await report.getByRole('img', { name: 'Folha com manchas' }).count(), 1);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.visit-report-actions').isVisible(), false);
    assert.equal(await report.getByRole('heading', { level: 1 }).isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await report.getByRole('button', { name: 'Fechar relatório', exact: true }).focus();
    await page.keyboard.press('Escape');
    await report.waitFor({ state: 'detached' });
    assert.equal(
      await page
        .getByRole('button', { name: 'Visualizar relatório', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    const calendarDownload = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar retorno para calendário', exact: true })
      .click();
    const calendar = await calendarDownload;
    assert.equal(calendar.suggestedFilename(), 'meuagro-retorno.ics');
    assert.match(await readFile(await calendar.path(), 'utf8'), /DTSTART;VALUE=DATE:20270106/);
    console.log('PASS: offline report, photo, print layout, focus restoration and calendar export');
    await page.getByRole('img', { name: 'Folha com manchas', exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole('img', { name: 'Folha com manchas', exact: true })
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    await page.screenshot({
      path: process.env.VISIT_TEST_SCREENSHOT || '../work/visit-anamnesis.png',
      fullPage: true,
    });
    console.log(
      'PASS: structured anamnesis, agricultural links and photo survive a full offline reload',
    );
    await context.setOffline(false);
    await page.goto('http://127.0.0.1:4184/more/settings#offline');
    let status = '';
    for (let i = 0; i < 120; i++) {
      status = await page.locator('#offline').textContent();
      if (committed.size === 1 && /\b0\s+registro\(s\)\s+aguardando\s+envio\./.test(status)) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.equal(committed.size, 1);
    assert.match(status, /\b0\s+registro\(s\)\s+aguardando\s+envio\./);
    assert.equal(visits.length, 1);
    assert.equal(photos.length, 1);
    assert.equal(visits[0].production_cycle_id, cid);
    assert.equal(visits[0].anamnesis.symptoms, 'Lesões nas folhas do talhão norte.');
    console.log('PASS: reconnect synchronizes one visit with one photo without duplication');
    await page.goto('http://127.0.0.1:4184/more/visits');
    await page.locator('#visit-search').fill('TALHAO NORTE');
    await page.getByRole('link', { name: 'Abrir anamnese', exact: true }).waitFor();
    await page.locator('#visit-return-filter').selectOption('none');
    assert.equal(await page.getByRole('link', { name: 'Abrir anamnese', exact: true }).count(), 0);
    await page.locator('#visit-return-filter').selectOption('');
    const csvDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar lista filtrada (CSV)', exact: true }).click();
    const csv = await csvDownload;
    assert.match(await readFile(await csv.path(), 'utf8'), /Produtor João/);
    console.log('PASS: return filter and CSV export follow the loaded history');
    await page.goto('http://127.0.0.1:4184/more/visits?id=' + visits[0].id);
    await page.getByRole('button', { name: 'Criar tarefa para esta visita', exact: true }).click();
    await page.locator('#task-title').fill('Reavaliar setor norte');
    await page.locator('#task-description').fill('Conferir a área e registrar observações.');
    await page.locator('#task-due').fill('2026-10-01');
    await page.locator('#task-priority').selectOption('high');
    await page.getByRole('button', { name: 'Adicionar etapa ao checklist', exact: true }).click();
    await page.getByLabel('Etapa do checklist 1', { exact: true }).fill('Conferir a área');
    await page.getByRole('button', { name: 'Adicionar etapa ao checklist', exact: true }).click();
    await page.getByLabel('Etapa do checklist 2', { exact: true }).fill('Registrar observações');
    await page.getByRole('button', { name: 'Salvar tarefa', exact: true }).click();
    await page.locator('.task-card').waitFor();
    assert.equal(tasks.length, 1);
    await page
      .locator('.task-card')
      .getByRole('button', { name: 'Atualizar tarefa', exact: true })
      .click();
    await page.locator('#task-state').selectOption('done');
    await page.locator('#task-outcome').fill('Conferido');
    await page.getByRole('button', { name: 'Salvar tarefa', exact: true }).click();
    await page
      .getByText('Conclua os itens do checklist antes de encerrar a tarefa.', { exact: true })
      .waitFor();
    assert.equal(tasks[0].status, 'pending');
    await page.getByRole('button', { name: 'Descartar edição', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Conferir a área', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Checklist: 1 de 2 concluído(s)', exact: true })
      .waitFor();
    await page.getByRole('checkbox', { name: 'Registrar observações', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Checklist: 2 de 2 concluído(s)', exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Abrir comentários da tarefa', exact: true }).click();
    await page
      .getByLabel('Nova observação sobre a execução', { exact: true })
      .fill('Conferência registrada <b>no local</b>.');
    await page.getByRole('button', { name: 'Registrar comentário', exact: true }).click();
    await page.getByText('Conferência registrada <b>no local</b>.', { exact: true }).waitFor();
    assert.equal(await page.locator('.comment-body b').count(), 0);
    assert.equal(comments.length, 1);
    await page.getByText('Prazo vencido', { exact: true }).waitFor();
    const taskICS = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar prazo para calendário', exact: true }).click();
    assert.match(
      await readFile(await (await taskICS).path(), 'utf8'),
      /DTSTART;VALUE=DATE:20261001/,
    );
    await page
      .locator('.task-card')
      .getByRole('button', { name: 'Atualizar tarefa', exact: true })
      .click();
    await page.locator('#task-state').selectOption('done');
    await page.locator('#task-outcome').fill('Área conferida e produtor orientado.');
    await page.getByRole('button', { name: 'Salvar tarefa', exact: true }).click();
    await page.locator('.task-card').waitFor({ state: 'detached' });
    assert.equal(tasks[0].status, 'done');
    await page.locator('#task-status-filter').selectOption('done');
    await page.locator('.task-card').waitFor();
    await page.getByRole('button', { name: 'Ver histórico da tarefa', exact: true }).click();
    await page.getByText('Últimas alterações — até 50', { exact: true }).waitFor();
    assert.equal(taskEvents.length, 5);
    await page.goto('http://127.0.0.1:4184/more/tasks');
    await page.locator('#task-status-filter').selectOption('');
    await page.locator('.task-card').waitFor();
    assert.equal(await page.getByText('Prazo vencido', { exact: true }).count(), 0);
    await page.locator('#task-search').fill('TALHAO NORTE');
    await page.locator('#task-view').selectOption('agenda');
    await page.getByRole('heading', { name: '01/10/2026', exact: true }).waitFor();
    const taskCSV = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar tarefas filtradas (CSV)', exact: true })
      .click();
    assert.match(await readFile(await (await taskCSV).path(), 'utf8'), /Reavaliar setor norte/);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.getByText('Resumo por responsável', { exact: true }).click();
    assert.equal(await page.locator('.responsible-summary article').count(), 1);
    const summaryCSV = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar resumo por responsável (CSV)', exact: true })
      .click();
    assert.match(await readFile(await (await summaryCSV).path(), 'utf8'), /Técnico Teste/);
    await page.locator('#task-view').selectOption('kanban');
    assert.equal(await page.locator('.kanban-column').count(), 4);
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal(
      await page
        .locator('.task-kanban')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
      4,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page
        .locator('.task-kanban')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
      1,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: '../work/task-collaboration-mobile.png', fullPage: true });
    console.log(
      'PASS: checklist, blocked completion, comments as text, Kanban and responsible CSV',
    );
    await context.setOffline(true);
    await page
      .getByText(
        'Conecte-se para gerenciar tarefas. As visitas e seus rascunhos continuam disponíveis conforme o preparo offline.',
        { exact: true },
      )
      .waitFor();
    assert.equal(await page.locator('.task-card').count(), 0);
    console.log(
      'PASS: create task, explicit completion, history, calendar, agenda, metrics, CSV and offline clearing',
    );
    assert.deepEqual(errors, []);
    console.log('PASS: searchable visit history and no uncaught browser errors');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

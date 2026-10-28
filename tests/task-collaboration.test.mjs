import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { managementFixture } from './management-fixture.mjs';
import {
  taskMatches,
  taskSummary,
  tasksCsv,
  taskCalendar,
  taskDate,
} from '../src/modules/tasks/taskModel.js';

test('agenda: datas civis, filtros, indicadores, CSV seguro e calendário', () => {
  const now = new Date(2026, 11, 31, 12),
    base = {
      id: randomUUID(),
      visit_id: randomUUID(),
      title: '=HYPERLINK("teste")',
      site_name: 'Sítio São João',
      area_name: 'Norte',
      producer_name: 'João',
      assigned_name: 'Técnico',
      assigned_to: 'a',
      created_by: 'b',
      priority: 'high',
      status: 'pending',
      due_date: '2026-12-30',
    };
  const items = [
    base,
    { ...base, status: 'done' },
    { ...base, status: 'doing', due_date: '2027-01-02' },
  ];
  assert.deepEqual(taskSummary(items, now), { open: 2, overdue: 1, doing: 1, done: 1 });
  assert.equal(taskMatches(base, { search: 'sao joao', period: 'overdue' }, now), true);
  assert.equal(taskMatches(items[1], { period: 'overdue' }, now), false);
  assert.equal(taskMatches(items[2], { period: 'week', person: 'mine', user: 'a' }, now), true);
  assert.equal(taskMatches(base, { person: 'mine', user: 'b' }, now), false);
  assert.equal(taskMatches(base, { from: '2027-01-01' }, now), false);
  assert.equal(taskDate('2026-02-30'), false);
  assert.equal(taskDate('2028-02-29'), true);
  assert.match(tasksCsv([base]), /"'=HYPERLINK/);
  assert.match(tasksCsv([base]), /Sítio São João/);
  const ics = taskCalendar({ ...base, due_date: '2026-12-31' }, now);
  assert.match(ics, /DTEND;VALUE=DATE:20270101/);
  assert.doesNotMatch(ics, /VALARM/);
  assert.throws(() => taskCalendar({ ...base, status: 'done' }));
});

test('tarefas: isolamento, delegação, situações, concorrência e auditoria', async (t) => {
  const { db, as, commerce, ids } = await managementFixture();
  const rpc = async (name, args = []) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        args,
      )
    ).rows[0].r;
  const command = (action, data, op = randomUUID()) =>
    rpc('technical_task_command', [op, action, data]);
  const migration = (f) => readFileSync(new URL('../supabase/' + f, import.meta.url), 'utf8');
  let company, personal, shared, task;
  const draft = (visit_id) => ({
    visit_id,
    title: 'Reavaliar talhão',
    description: 'Conferir a área norte',
    due_date: '2026-10-25',
    priority: 'high',
  });
  try {
    await db.exec(`create table areas(id uuid primary key,user_id uuid,property_id uuid,deleted_at timestamptz);
  create table crops(id uuid primary key,user_id uuid,is_system boolean,active boolean);
  create table production_cycles(id uuid primary key,user_id uuid,property_id uuid,area_id uuid,crop_id uuid,deleted_at timestamptz);
  create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key,bucket_id text,name text);create function storage.foldername(p text) returns text[] language sql as $$select string_to_array(p,'/')$$;`);
    for (const file of [
      'stage_32_company_team.sql',
      'stage_33_technical_visits.sql',
      'stage_39_technical_tasks.sql',
      'stage_39_technical_tasks.sql',
      'stage_40_task_collaboration.sql',
      'stage_40_task_collaboration.sql',
    ])
      await db.exec(migration(file));
    await as(1);
    await commerce('enable', { name: 'Dono' });
    company = (await commerce('create_company', { name: 'Equipe técnica' })).seller_id;
    for (const n of [2, 3, 4]) {
      await as(1);
      await commerce('invite', { seller_id: company, email: `user${n}@example.test` });
      const invite = (
        await db.query('select token from commerce_invitations where email=$1', [
          `user${n}@example.test`,
        ])
      ).rows[0];
      await as(n);
      await commerce('enable', { name: 'Profissional ' + n });
      await commerce('accept_invite', { token: invite.token });
    }
    await as(1);
    await rpc('management_command', [
      'grant',
      { seller_id: company, agent_id: ids[1], role: 'manager', finance: false },
      randomUUID(),
    ]);
    await as(3);
    async function visit(seller = null) {
      const id = randomUUID();
      await rpc('sync_visit_operation', [
        ids[2],
        id,
        {
          kind: 'visit',
          visit: {
            id,
            seller_id: seller,
            producer_name: 'Produtor João',
            site_name: 'Sítio Horizonte',
            area_name: 'Norte',
            crop_name: 'Milho',
            visited_at: '2026-10-20T12:00:00Z',
            priority: 'medium',
            anamnesis: { reason: 'CONTEÚDO PRIVADO DA FICHA' },
          },
          photos: [],
        },
      ]);
      return id;
    }
    personal = await visit();
    shared = await visit(company);
    await t.test('pessoal é privada e operações repetidas não duplicam tarefas', async () => {
      const op = randomUUID(),
        data = draft(personal);
      const result = await command('create', data, op);
      assert.deepEqual(await command('create', data, op), result);
      await assert.rejects(
        command('create', { ...data, title: 'Outro título' }, op),
        /Identificador/,
      );
      await assert.rejects(command('create', { ...data, assigned_to: ids[3] }), /Responsável/);
      await assert.rejects(db.query('select * from technical_tasks'), /permission denied/);
      for (const n of [1, 2, 4, 5]) {
        await as(n);
        assert.equal((await rpc('technical_task_list', [personal])).items.length, 0);
      }
      await as(3);
      assert.equal((await rpc('technical_task_list', [personal])).items.length, 1);
    });
    await t.test('somente gestão delega; representante recebe tarefa sem anamnese', async () => {
      await assert.rejects(
        command('create', { ...draft(shared), assigned_to: ids[3] }),
        /Responsável/,
      );
      await as(2);
      const ctx = await rpc('technical_task_context', [shared]);
      assert.equal(ctx.can_assign, true);
      assert.equal(ctx.people.length, 4);
      await assert.rejects(
        command('create', { ...draft(shared), assigned_to: ids[4] }),
        /Responsável/,
      );
      task = await command('create', { ...draft(shared), assigned_to: ids[3] });
      await as(4);
      const list = await rpc('technical_task_list', [null]);
      assert.equal(list.items.length, 1);
      assert.equal(list.items[0].can_open_visit, false);
      assert.equal(list.items[0].can_edit, false);
      assert.doesNotMatch(JSON.stringify(list), /CONTEÚDO PRIVADO/);
      assert.equal(
        (await db.query('select * from technical_visits where id=$1', [shared])).rows.length,
        0,
      );
      await assert.rejects(
        command('update', { id: task.id, version: 1, title: 'Alteração indevida' }),
        /não editar/,
      );
    });
    await t.test('conclusão explícita, versão e histórico atômicos', async () => {
      await assert.rejects(
        command('update', { id: task.id, version: 1, status: 'done', outcome: '' }),
        /resultado/,
      );
      const op = randomUUID(),
        data = { id: task.id, version: 1, status: 'done', outcome: 'Área conferida no campo' };
      const result = await command('update', data, op);
      assert.equal(result.version, 2);
      assert.deepEqual(await command('update', data, op), result);
      await assert.rejects(command('update', { ...data, status: 'pending' }), /mudou/);
      const history = await rpc('technical_task_history', [task.id]);
      assert.equal(history.length, 2);
      assert.equal(history[0].snapshot.status, 'done');
      await as(5);
      await assert.rejects(rpc('technical_task_history', [task.id]), /indisponível/);
      await as(2);
      const reopened = await command('update', {
        id: task.id,
        version: 2,
        status: 'pending',
        outcome: 'Revisar novamente',
        assigned_to: ids[2],
      });
      assert.equal(reopened.version, 3);
      await as(4);
      assert.equal((await rpc('technical_task_list')).items.length, 0);
      await assert.rejects(rpc('technical_task_history', [task.id]));
    });
    await t.test('checklist e comentários: autorização, reenvio e conclusão', async () => {
      await as(2);
      const step = { id: randomUUID(), label: 'Conferir a área norte', done: false };
      const result = await command('create', {
        ...draft(shared),
        assigned_to: ids[3],
        checklist: [step],
      });
      await assert.rejects(
        command('create', { ...draft(shared), checklist: [step, step] }),
        /duplicado/,
      );
      await assert.rejects(
        command('create', {
          ...draft(shared),
          checklist: Array.from({ length: 21 }, () => ({ ...step, id: randomUUID() })),
        }),
        /20/,
      );
      await as(4);
      await assert.rejects(
        command('update', { id: result.id, version: 1, status: 'done', outcome: 'Conferido' }),
        /checklist/,
      );
      await assert.rejects(
        command('update', { id: result.id, version: 1, checklist: [] }),
        /não editar/,
      );
      const comment = randomUUID(),
        data = { id: result.id, body: '  Aguardando acesso ao local.  ' };
      await command('comment', data, comment);
      await command('comment', data, comment);
      const comments = await rpc('technical_task_comment_list', [result.id]);
      assert.equal(comments.length, 1);
      assert.equal(comments[0].body, 'Aguardando acesso ao local.');
      assert.equal(
        (await rpc('technical_task_list')).items.find((i) => i.id === result.id).version,
        1,
      );
      await assert.rejects(command('comment', { id: result.id, body: ' ' }), /comentário/);
      await assert.rejects(db.query('select * from technical_task_comments'), /permission denied/);
      const op = randomUUID(),
        check = { id: result.id, version: 1, item_id: step.id, done: true };
      assert.equal((await command('check', check, op)).version, 2);
      assert.equal((await command('check', check, op)).version, 2);
      await assert.rejects(command('check', { ...check, done: false }), /mudou/);
      await command('update', {
        id: result.id,
        version: 2,
        status: 'done',
        outcome: 'Área conferida',
      });
      await assert.rejects(command('check', { ...check, version: 3, done: false }), /Reabra/);
      const history = await rpc('technical_task_history', [result.id]);
      assert.equal(history.length, 4);
      assert.equal(history.filter((h) => h.action === 'comment').length, 1);
      await as(5);
      await assert.rejects(rpc('technical_task_comment_list', [result.id]));
      await assert.rejects(command('comment', { id: result.id, body: 'Intrusão' }));
      await as(4);
    });
    await t.test(
      'desativação bloqueia integrante; dono e gerente mantêm visão da empresa',
      async () => {
        await as(2);
        const own = await command('create', { ...draft(shared), assigned_to: ids[3] });
        await as(1);
        await rpc('management_team_command', [
          'remove_member',
          {
            seller_id: company,
            expected_role: 'representative',
            expected_finance: false,
            membership_id: (
              await db.query(
                'select id from commerce_memberships where seller_id=$1 and user_id=$2',
                [company, ids[3]],
              )
            ).rows[0].id,
          },
          randomUUID(),
        ]);
        await as(4);
        assert.equal((await rpc('technical_task_list')).items.length, 0);
        await assert.rejects(command('update', { id: own.id, version: 1, status: 'doing' }));
        await as(1);
        assert.equal((await rpc('technical_task_list', [shared])).items.length, 3);
        await as(null, 'anon');
        await assert.rejects(rpc('technical_task_list'));
      },
    );
  } finally {
    await db.close();
  }
});

test('resumo separa pessoas/empresas, checklist valida IDs e Kanban mantém situações', async () => {
  const { validateChecklist, responsibleSummary, kanbanGroups, responsibleCsv } =
    await import('../src/modules/tasks/taskCollaboration.js');
  const id = randomUUID(),
    step = { id: randomUUID(), label: '  Conferir  ', done: false };
  assert.equal(validateChecklist([step])[0].label, 'Conferir');
  assert.throws(() => validateChecklist([step, step]));
  const items = [
    {
      assigned_to: id,
      assigned_name: '=Fórmula',
      seller_id: null,
      status: 'pending',
      due_date: '2026-10-01',
      checklist: [step],
    },
    {
      assigned_to: id,
      assigned_name: '=Fórmula',
      seller_id: 'empresa',
      company_name: 'Empresa A',
      status: 'done',
      due_date: '2026-10-01',
      checklist: [step],
    },
  ];
  const summary = responsibleSummary(items, new Date(2026, 9, 20, 12));
  assert.equal(summary.length, 2);
  assert.equal(
    summary.reduce((s, r) => s + r.remaining, 0),
    1,
  );
  assert.equal(
    summary.reduce((s, r) => s + r.overdue, 0),
    1,
  );
  assert.equal(taskMatches(items[0], { responsible: 'personal:' + id }), true);
  assert.equal(taskMatches(items[1], { responsible: 'personal:' + id }), false);
  assert.equal(kanbanGroups(items).find((g) => g.key === 'done').items.length, 1);
  assert.match(responsibleCsv(summary), /"'=Fórmula"/);
});

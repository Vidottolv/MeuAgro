import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { operationsFixture } from './operations-fixture.mjs';
import { makeSupportDiagnostic } from '../src/modules/operations/supportDiagnostic.js';
test('diagnóstico permite somente contagens explícitas, sem sessão ou conteúdo pessoal', () => {
  const secret = 'SEGREDO-NUNCA-EXPORTAR';
  const result = makeSupportDiagnostic(
    {
      checkout_review: 2,
      billing_pending: true,
      requests: [{ note: secret }],
      user_id: secret,
      satellite: { images_failed: 3, token: secret },
    },
    {
      online: true,
      pending: 4,
      preparedAt: '2026-01-01',
      user: secret,
      queue: [{ state: 'review', error: secret, payload: secret }],
      access_token: secret,
    },
  );
  assert.equal(result.offline.review, 1);
  assert.equal(result.server.satellite.images_failed, 3);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(secret));
  assert.equal(makeSupportDiagnostic(null, { pending: -1 }).offline.pending, 0);
  assert.equal(makeSupportDiagnostic(null, {}).server, null);
});
test('operação e privacidade: isolamento, idempotência, revisão, auditoria e ausência de exclusão automática', async (t) => {
  const f = await operationsFixture();
  const { db, as, rpc } = f;
  let request;
  try {
    await t.test('diagnóstico privado sem consultar ou modificar o provedor', async () => {
      await as(null, 'postgres');
      await db.query(
        "insert into satellite_images(user_id,status,created_at) values($1,'processing',now()-interval '10 minutes'),($2,'failed',now())",
        [f.other, f.user],
      );
      await db.query("insert into satellite_searches(user_id,status) values($1,'failed')", [
        f.other,
      ]);
      await db.query(
        "insert into app_billing_diagnostics(environment,event_id,outcome) values('sandbox','evt_test','provider_failed')",
      );
      await as(f.other);
      const c = await rpc('app_operations_context');
      assert.equal(c.is_admin, false);
      assert.equal(c.satellite.images_pending, 1);
      assert.equal(c.satellite.images_failed, 0);
      assert.equal(c.satellite.searches_failed, 1);
      assert.deepEqual(c.requests, []);
      assert.doesNotMatch(
        JSON.stringify(c),
        /cus_manual|sub_manual|pay_manual|document_hash|invoice_url/,
      );
      await assert.rejects(rpc('app_operations_admin', [0]), /exclusivo/);
      await assert.rejects(db.query('select * from app_privacy_requests'), /permission denied/);
    });
    await t.test(
      'solicitação autenticada é repetível pelo mesmo identificador e limitada por tipo',
      async () => {
        const op = randomUUID();
        request = await rpc('app_privacy_submit', [op, 'delete']);
        assert.deepEqual(await rpc('app_privacy_submit', [op, 'delete']), request);
        await assert.rejects(rpc('app_privacy_submit', [op, 'export']), /utilizada/);
        await assert.rejects(rpc('app_privacy_submit', [randomUUID(), 'delete']), /Já há/);
        await assert.rejects(rpc('app_privacy_submit', [randomUUID(), 'other']), /inválida/);
        assert.equal((await rpc('app_operations_context')).requests.length, 1);
        await as(f.user);
        assert.equal((await rpc('app_operations_context')).requests.length, 0);
        await assert.rejects(
          rpc('app_privacy_withdraw', [randomUUID(), request.id, 1]),
          /indisponível/,
        );
        await as(f.other);
        await assert.rejects(
          rpc('app_privacy_review', [randomUUID(), request.id, 1, 'review', 'Resposta autorizada']),
          /exclusivo/,
        );
      },
    );
    await t.test(
      'administrador revisa com versão, nota e trilha; não pode pular direto para concluída',
      async () => {
        await as(f.user);
        const a = await rpc('app_operations_admin', [0]);
        assert.equal(a.privacy_open, 1);
        assert.equal(a.billing_errors_24h, 1);
        assert.equal(a.requests[0].user_id, f.other);
        await assert.rejects(rpc('app_operations_admin', [-1]), /Página inválida/);
        await assert.rejects(
          rpc('app_privacy_review', [
            randomUUID(),
            request.id,
            1,
            'fulfilled',
            'Atendimento concluído',
          ]),
          /transição/,
        );
        await assert.rejects(
          rpc('app_privacy_review', [randomUUID(), request.id, 1, 'review', 'curto']),
          /10 a 500/,
        );
        const op = randomUUID(),
          args = [op, request.id, 1, 'review', 'Identidade e escopo em conferência.'];
        assert.deepEqual(await rpc('app_privacy_review', args), { ok: true });
        assert.deepEqual(await rpc('app_privacy_review', args), { ok: true });
        await assert.rejects(
          rpc('app_privacy_review', [
            randomUUID(),
            request.id,
            1,
            'review',
            'Uma resposta válida.',
          ]),
          /mudou/,
        );
        await as(f.other);
        const c = await rpc('app_operations_context');
        assert.equal(c.requests[0].status, 'review');
        assert.equal(c.requests[0].version, 2);
        await assert.rejects(
          rpc('app_privacy_withdraw', [randomUUID(), request.id, 2]),
          /atendimento/,
        );
        await as(null, 'postgres');
        assert.equal(
          (await db.query('select count(*)::int n from auth.users where id=$1', [f.other])).rows[0]
            .n,
          1,
        );
        assert.equal(
          (
            await db.query('select count(*)::int n from app_privacy_audit where request_id=$1', [
              request.id,
            ])
          ).rows[0].n,
          2,
        );
        await as(f.user);
        await rpc('app_privacy_review', [
          randomUUID(),
          request.id,
          2,
          'fulfilled',
          'Atendimento manual verificado; escopo comunicado por canal seguro.',
        ]);
        await assert.rejects(
          rpc('app_privacy_review', [
            randomUUID(),
            request.id,
            3,
            'review',
            'Reabertura indevida.',
          ]),
          /transição/,
        );
        await as(f.other);
        assert.equal((await rpc('app_operations_context')).requests[0].status, 'fulfilled');
        await assert.rejects(rpc('app_privacy_submit', [randomUUID(), 'delete']), /24 horas/);
      },
    );
    await t.test(
      'retirada própria idempotente preserva histórico; conta sem perfil administrativo não ganha acesso',
      async () => {
        const other = await rpc('app_privacy_submit', [randomUUID(), 'export']);
        const op = randomUUID();
        await rpc('app_privacy_withdraw', [op, other.id, 1]);
        await rpc('app_privacy_withdraw', [op, other.id, 1]);
        assert.ok(
          (await rpc('app_operations_context')).requests.some(
            (x) => x.id === other.id && x.status === 'withdrawn',
          ),
        );
        await as(null, 'postgres');
        await db.query('update app_platform_admins set active=false where user_id=$1', [f.user]);
        await as(f.user);
        await assert.rejects(rpc('app_operations_admin', [0]), /exclusivo/);
        await assert.rejects(
          rpc('app_privacy_review', [randomUUID(), other.id, 2, 'review', 'Resposta válida.']),
          /exclusivo/,
        );
        await assert.rejects(db.query('delete from app_privacy_audit'), /permission denied/);
        await as(null, 'anon');
        await assert.rejects(rpc('app_operations_context'), /permission denied/);
        await assert.rejects(
          rpc('app_privacy_submit', [randomUUID(), 'export']),
          /permission denied/,
        );
        await as(null, 'authenticated');
        await assert.rejects(rpc('app_operations_context'), /Entre/);
      },
    );
  } finally {
    await db.close();
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { prioritiesFixture } from './priorities-fixture.mjs';

test('administração: permissões, catálogo, vínculos, auditoria e diagnóstico', async (t) => {
  const f = await prioritiesFixture();
  const { db, as, rpc, user, other } = f;
  try {
    await db.exec('reset role');
    const sql = readFileSync(
      new URL('../supabase/stage_49_platform_admin.sql', import.meta.url),
      'utf8',
    );
    await db.exec(sql);
    await db.exec(sql);
    await db.query('insert into app_platform_admins(user_id) values($1)', [user]);
    await t.test(
      'titular/gerente não recebe administração; tabelas e comandos de serviço protegidos',
      async () => {
        await as(other);
        assert.equal(await rpc('app_is_platform_admin'), false);
        await assert.rejects(rpc('app_admin_context'), /exclusivo/);
        await assert.rejects(db.query('select * from app_platform_admins'), /permission denied/);
        await assert.rejects(
          db.query('insert into app_platform_admins(user_id) values($1)', [other]),
          /permission denied/,
        );
        await assert.rejects(rpc('app_admin_link', [other, randomUUID(), {}]), /permission denied/);
        await assert.rejects(rpc('app_billing_apply_v48', ['evt', {}]), /permission denied/);
        await assert.rejects(
          rpc('app_billing_log', ['sandbox', 'evt', null, null, 'processed']),
          /permission denied/,
        );
        await as(user, 'anon');
        await assert.rejects(rpc('app_admin_context'), /permission denied/);
      },
    );
    let plan;
    await t.test(
      'catálogo exige confirmação da versão, motivo e centavos; reenvio não duplica auditoria',
      async () => {
        await as(user);
        const context = await rpc('app_admin_context');
        assert.equal(context.accounts.length, 6);
        plan = context.plans.find((p) => p.code === 'company10');
        const payload = {
          code: 'company10',
          expected: plan,
          monthly_cents: '1000',
          storage_bytes: null,
          published: false,
          reason: 'Preço do piloto',
        };
        const operation = randomUUID();
        await rpc('app_admin_command', [operation, 'plan', payload]);
        assert.equal((await rpc('app_admin_command', [operation, 'plan', payload])).replayed, true);
        await assert.rejects(
          rpc('app_admin_command', [operation, 'plan', { ...payload, monthly_cents: '2000' }]),
          /reutilizado/,
        );
        await assert.rejects(rpc('app_admin_command', [randomUUID(), 'plan', payload]), /mudou/);
        const latest = (await rpc('app_admin_context')).plans.find((p) => p.code === 'company10');
        await assert.rejects(
          rpc('app_admin_command', [
            randomUUID(),
            'plan',
            { ...payload, expected: latest, monthly_cents: '0' },
          ]),
          /inválidos/,
        );
        await assert.rejects(
          rpc('app_admin_command', [
            randomUUID(),
            'plan',
            { ...payload, expected: latest, reason: '' },
          ]),
          /motivo/,
        );
        await db.exec('reset role');
        assert.equal((await db.query('select count(*)::int n from app_admin_audit')).rows[0].n, 1);
      },
    );
    const binding = {
      user_id: other,
      plan_code: 'company10',
      version: 0,
      customer: 'cus_verified',
      subscription: 'sub_verified',
      expected_cents: 1000,
      environment: 'sandbox',
      cycle: 'MONTHLY',
      reason: 'Assinatura conferida no Asaas',
    };
    await t.test(
      'vínculo somente após papel administrativo e valor compatível; versão e unicidade',
      async () => {
        await as('', 'service_role');
        await assert.rejects(
          rpc('app_admin_link', [other, randomUUID(), binding]),
          /não autorizado/,
        );
        await assert.rejects(
          rpc('app_admin_link', [user, randomUUID(), { ...binding, expected_cents: 1 }]),
          /difere/,
        );
        const operation = randomUUID();
        await rpc('app_admin_link', [user, operation, binding]);
        assert.equal((await rpc('app_admin_link', [user, operation, binding])).replayed, true);
        await assert.rejects(rpc('app_admin_link', [user, randomUUID(), binding]), /mudou/);
        await assert.rejects(
          rpc('app_admin_link', [user, randomUUID(), { ...binding, user_id: user }]),
          /unique/,
        );
        await as(user);
        const context = await rpc('app_admin_context', ['', 0, other]);
        assert.equal(context.accounts[0].subscription.provider_customer, 'cus_verified');
        assert.equal(context.audit.filter((a) => a.action === 'link').length, 1);
      },
    );
    await t.test(
      'diagnóstico de vínculo ausente/ambiente errado e reprocessamento após correção',
      async () => {
        await as('', 'service_role');
        const date = (await db.query('select current_date::text d')).rows[0].d;
        const payment = {
          id: 'pay_verified',
          customer: 'cus_verified',
          subscription: 'sub_wrong',
          status: 'RECEIVED',
          amount_cents: 1000,
          dueDate: date,
          invoiceUrl: null,
          checked_at: new Date().toISOString(),
          environment: 'sandbox',
        };
        assert.equal(
          (await rpc('app_billing_apply', ['evt_verified', payment])).outcome,
          'unlinked',
        );
        assert.equal(
          (
            await rpc('app_billing_apply', [
              'evt_wrong_environment',
              { ...payment, subscription: 'sub_verified', environment: 'production' },
            ])
          ).outcome,
          'environment_mismatch',
        );
        payment.subscription = 'sub_verified';
        assert.equal(
          (await rpc('app_billing_apply', ['evt_verified', payment])).outcome,
          'processed',
        );
        await rpc('app_billing_apply', ['evt_verified', payment]);
        await as(user);
        const ctx = await rpc('app_admin_context', ['', 0, other]);
        assert.equal(ctx.payments.length, 1);
        assert.ok(ctx.accounts[0].valid_until);
        assert.equal(ctx.diagnostics.find((d) => d.event_id === 'evt_verified').attempts, 3);
        assert.equal(
          ctx.diagnostics.find((d) => d.event_id === 'evt_verified').outcome,
          'processed',
        );
        await as('', 'service_role');
        await assert.rejects(
          rpc('app_billing_apply', ['evt_legacy', { ...payment, environment: null }]),
          /atualizada/,
        );
        await rpc('app_billing_apply', [
          'evt_refund',
          { ...payment, status: 'REFUNDED', checked_at: new Date(Date.now() + 1000).toISOString() },
        ]);
        await as(user);
        assert.equal(
          (await rpc('app_admin_context', ['', 0, other])).accounts[0].valid_until,
          null,
        );
      },
    );
    await t.test(
      'concessão manual até 90 dias, versão, revogação e criação sem cobrar',
      async () => {
        await as(user);
        let account = (await rpc('app_admin_context', ['', 0, other])).accounts[0];
        const data = {
          user_id: other,
          version: account.subscription.version,
          until: new Date(Date.now() + 86400000).toISOString(),
          reason: 'Período para homologação',
        };
        await rpc('app_admin_command', [randomUUID(), 'trial', data]);
        await assert.rejects(rpc('app_admin_command', [randomUUID(), 'trial', data]), /mudou/);
        account = (await rpc('app_admin_context', ['', 0, other])).accounts[0];
        await assert.rejects(
          rpc('app_admin_command', [
            randomUUID(),
            'trial',
            {
              ...data,
              version: account.subscription.version,
              until: new Date(Date.now() + 100 * 86400000).toISOString(),
            },
          ]),
          /90 dias/,
        );
        await rpc('app_admin_command', [
          randomUUID(),
          'revoke_trial',
          {
            user_id: other,
            version: account.subscription.version,
            reason: 'Fim da concessão de teste',
          },
        ]);
        await rpc('app_admin_command', [
          randomUUID(),
          'trial',
          {
            user_id: user,
            version: 0,
            plan_code: 'company10',
            until: data.until,
            reason: 'Teste inicial sem cobrança',
          },
        ]);
        const own = (await rpc('app_admin_context', ['', 0, user])).accounts[0];
        assert.ok(own.valid_until);
        assert.equal(own.subscription.provider_subscription, null);
        await as('', 'service_role');
        await rpc('app_admin_link', [
          user,
          randomUUID(),
          {
            ...binding,
            user_id: user,
            version: own.subscription.version,
            subscription: 'sub_production',
            environment: 'production',
          },
        ]);
        await as(user);
        const connected = (await rpc('app_admin_context', ['', 0, user])).accounts[0];
        assert.equal(connected.subscription.billing_environment, 'production');
        assert.ok(connected.subscription.manual_until);
        await as('', 'service_role');
        await assert.rejects(
          rpc('app_admin_link', [
            user,
            randomUUID(),
            {
              ...binding,
              user_id: user,
              version: connected.subscription.version,
              subscription: 'sub_crossenv',
            },
          ]),
          /ambiente/,
        );
      },
    );
    await t.test('revogar administrador bloqueia comandos imediatamente', async () => {
      await db.exec('reset role');
      await db.query('update app_platform_admins set active=false where user_id=$1', [user]);
      await as(user);
      await assert.rejects(rpc('app_admin_context'), /exclusivo/);
      await assert.rejects(rpc('app_admin_command', [randomUUID(), 'trial', {}]), /exclusivo/);
      await as('', 'service_role');
      await assert.rejects(rpc('app_admin_link', [user, randomUUID(), binding]), /não autorizado/);
    });
  } finally {
    await db.close();
  }
});

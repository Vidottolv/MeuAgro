import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { managementFixture } from './management-fixture.mjs';

test('Gerentes: convites, permissões, isolamento e revogação', async (t) => {
  const f = await managementFixture(),
    { db, as, commerce, rows, ids } = f;
  const migration = readFileSync(
    new URL('../supabase/stage_32_company_team.sql', import.meta.url),
    'utf8',
  );
  const rpc = async (name, args) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        args,
      )
    ).rows[0].r;
  let company, otherCompany, managerInvite, representativeInvite, managerMembership;
  const team = (seller = company) => rpc('management_team', [seller]);
  const command = (action, data, op = randomUUID()) =>
    rpc('management_team_command', [action, { seller_id: company, ...data }, op]);
  async function accept(n, invitation) {
    await as(n);
    await commerce('enable', { name: 'Profissional ' + n });
    await commerce('accept_invite', { token: invitation.token });
  }
  try {
    await db.exec(migration);
    await db.exec(migration);
    await as(1);
    await commerce('enable', { name: 'Dono' });
    company = (await commerce('create_company', { name: 'Empresa gerenciada' })).seller_id;
    await as(5);
    await commerce('enable', { name: 'Outra empresa' });
    otherCompany = (await commerce('create_company', { name: 'Outra empresa' })).seller_id;
    await as(1);
    await t.test(
      'dono convida gerente diretamente e repetição não cria convites duplicados',
      async () => {
        const data = { email: 'USER2@example.test', role: 'manager', finance: false },
          op = randomUUID();
        const result = await command('invite', data, op);
        assert.deepEqual(await command('invite', data, op), result);
        await assert.rejects(command('invite', { ...data, finance: true }, op), /outros dados/);
        managerInvite = (await team()).invitations.find((i) => i.id === result.id);
        assert.equal(managerInvite.role, 'manager');
        assert.ok(managerInvite.token);
        assert.equal((await team()).invitations.length, 1);
      },
    );
    await t.test('somente e-mail confirmado do destinatário aceita o convite', async () => {
      await as(3);
      await commerce('enable', { name: 'Representante' });
      await assert.rejects(
        commerce('accept_invite', { token: managerInvite.token }),
        /e-mail confirmado/,
      );
      await as(6);
      await commerce('enable', { name: 'Não confirmado' });
      await assert.rejects(
        commerce('accept_invite', { token: managerInvite.token }),
        /e-mail confirmado/,
      );
      await accept(2, managerInvite);
      const result = await team();
      managerMembership = result.members.find((m) => m.user_id === ids[1]);
      assert.equal(managerMembership.role, 'manager');
      assert.equal(result.owner, false);
      assert.equal(result.finance, false);
      assert.equal((await rpc('management_companies', [])).length, 1);
      await assert.rejects(
        commerce('accept_invite', { token: managerInvite.token }),
        /já utilizado/,
      );
    });
    await t.test(
      'gerente convida representante mas não concede gestão ou acesso financeiro',
      async () => {
        await assert.rejects(
          command('invite', { email: 'user3@example.test', role: 'manager' }),
          /Somente o dono/,
        );
        await assert.rejects(
          command('invite', { email: 'user3@example.test', role: 'representative', finance: true }),
          /Revise/,
        );
        const result = await command('invite', {
          email: 'user3@example.test',
          role: 'representative',
        });
        representativeInvite = (await team()).invitations.find((i) => i.id === result.id);
        await assert.rejects(command('invite', { email: 'user1@example.test' }), /responsável/);
        await accept(3, representativeInvite);
        await assert.rejects(team(), /Equipe indisponível/);
        await assert.rejects(
          command('invite', { email: 'user4@example.test' }),
          /administrar esta equipe/,
        );
      },
    );
    await t.test('isolamento entre empresas também é validado em comandos e RPCs', async () => {
      await as(2);
      await assert.rejects(team(otherCompany), /Equipe indisponível/);
      await assert.rejects(
        command('invite', { seller_id: otherCompany, email: 'user4@example.test' }),
        /administrar esta equipe/,
      );
      await assert.rejects(
        command('set_role', {
          membership_id: managerMembership.id,
          expected_role: 'manager',
          role: 'manager',
          finance: true,
        }),
        /Somente o dono/,
      );
      await assert.rejects(
        command('remove_member', { membership_id: managerMembership.id, expected_role: 'manager' }),
        /Vínculo indisponível/,
      );
      await assert.rejects(
        rpc('commerce_command_before_team', ['enable', { name: 'Bypass' }]),
        /permission denied/,
      );
    });
    await t.test(
      'gerente cancela convites de representantes e não altera convites de gerentes',
      async () => {
        await as(1);
        const result = await command('invite', { email: 'user4@example.test', role: 'manager' });
        await as(2);
        assert.ok(!(await team()).invitations.some((i) => i.id === result.id));
        await assert.rejects(
          command('revoke_invite', { invitation_id: result.id }),
          /Somente o dono/,
        );
        await as(1);
        await command('revoke_invite', { invitation_id: result.id });
        await as(2);
        const rep = await command('invite', { email: 'user4@example.test' });
        await command('revoke_invite', { invitation_id: rep.id });
        assert.equal((await team()).invitations.find((i) => i.id === rep.id).status, 'revoked');
      },
    );
    await t.test(
      'dono promove e rebaixa, com permissão financeira separada e proteção contra tela antiga',
      async () => {
        await as(1);
        const rep = (await team()).members.find((m) => m.user_id === ids[2]);
        await command('set_role', {
          membership_id: rep.id,
          expected_role: 'representative',
          expected_finance: false,
          role: 'manager',
          finance: true,
        });
        await assert.rejects(
          command('remove_member', {
            membership_id: rep.id,
            expected_role: 'representative',
            expected_finance: false,
          }),
          /permissões mudaram/,
        );
        await as(3);
        assert.equal((await team()).finance, true);
        await as(1);
        await command('set_role', {
          membership_id: rep.id,
          expected_role: 'manager',
          expected_finance: true,
          role: 'representative',
          finance: false,
        });
        await as(3);
        await assert.rejects(team(), /Equipe indisponível/);
      },
    );
    await t.test(
      'gerente remove representante sem remover histórico nem reter permissões',
      async () => {
        await as(2);
        const rep = (await team()).members.find((m) => m.user_id === ids[2]);
        const data = { membership_id: rep.id, expected_role: 'representative' },
          op = randomUUID();
        const result = await command('remove_member', data, op);
        assert.deepEqual(await command('remove_member', data, op), result);
        const after = (await team()).members.find((m) => m.id === rep.id);
        assert.equal(after.active, false);
        assert.ok(after.ended_at);
        await as(3);
        await assert.rejects(commerce('select_seller', { seller_id: company }), /vínculo ativo/);
      },
    );
    await t.test('revogação do gerente invalida seus convites pendentes', async () => {
      await as(2);
      const r = await command('invite', { email: 'user4@example.test' });
      const pending = (await team()).invitations.find((i) => i.id === r.id);
      await as(1);
      await command('set_role', {
        membership_id: managerMembership.id,
        expected_role: 'manager',
        expected_finance: false,
        role: 'representative',
        finance: false,
      });
      await as(2);
      await assert.rejects(team(), /Equipe indisponível/);
      await as(4);
      await commerce('enable', { name: 'Convidado' });
      await assert.rejects(
        commerce('accept_invite', { token: pending.token }),
        /responsável pelo convite/,
      );
      await as(1);
      assert.equal((await team()).invitations.find((i) => i.id === pending.id).status, 'revoked');
      await command('set_role', {
        membership_id: managerMembership.id,
        expected_role: 'representative',
        expected_finance: false,
        role: 'manager',
        finance: false,
      });
      await as(4);
      await assert.rejects(commerce('accept_invite', { token: pending.token }), /Convite inválido/);
      await as(1);
      await command('set_role', {
        membership_id: managerMembership.id,
        expected_role: 'manager',
        expected_finance: false,
        role: 'representative',
        finance: false,
      });
    });
    await t.test('remoção por proprietário limpa gestão e concessão financeira', async () => {
      await as(1);
      await command('set_role', {
        membership_id: managerMembership.id,
        expected_role: 'representative',
        expected_finance: false,
        role: 'manager',
        finance: true,
      });
      await command('remove_member', {
        membership_id: managerMembership.id,
        expected_role: 'manager',
        expected_finance: true,
      });
      const inactive = (await team()).members.find((m) => m.id === managerMembership.id);
      assert.equal(inactive.active, false);
      assert.equal(inactive.role, 'representative');
      assert.equal(inactive.finance, false);
      await as(2);
      assert.deepEqual(await rpc('management_companies', []), []);
    });
    await t.test(
      'acesso anônimo negado e migração reaplicável preserva vínculos e auditoria',
      async () => {
        await as(null, 'anon');
        await assert.rejects(team(), /permission denied/);
        await db.exec('reset role');
        const before = (await rows('commerce_memberships')).length;
        await db.exec(migration);
        assert.equal((await rows('commerce_memberships')).length, before);
        assert.ok(
          (await rows('management_audit')).some((row) => row.action === 'team_accept_invite'),
        );
        assert.ok(
          (await rows('management_audit')).some((row) => row.action === 'team_remove_member'),
        );
      },
    );
  } finally {
    await db.close();
  }
});

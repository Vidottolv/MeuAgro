import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { profileOnboardingFixture } from './profile-onboarding-fixture.mjs';
import { profileSteps, suggestedProfile } from '../src/modules/onboarding/profileOnboarding.js';

test('roteiro persiste por titular, controla versão e não altera plano, papel ou assinatura', async () => {
  const f = await profileOnboardingFixture();
  try {
    await f.as(f.other);
    const before = await f.rpc('app_account_context');
    const initial = await f.rpc('app_onboarding_context');
    assert.equal(initial.preference, null);
    assert.equal(initial.companies.length, 0);
    assert.equal(suggestedProfile(initial), 'producer');
    const op = randomUUID();
    const saved = await f.rpc('app_onboarding_save', [op, 'manager', 0, true]);
    assert.equal(saved.version, 1);
    assert.deepEqual(await f.rpc('app_onboarding_save', [op, 'manager', 0, true]), saved);
    await assert.rejects(
      f.rpc('app_onboarding_save', [op, 'company', 0, true]),
      /Operação já utilizada/,
    );
    let context = await f.rpc('app_onboarding_context');
    assert.ok(context.preference.reviewed_at);
    assert.equal(context.companies.length, 0);
    assert.equal(
      profileSteps('manager', context, false).find((s) => s.id === 'membership').done,
      false,
    );
    assert.deepEqual((await f.rpc('app_account_context')).subscription, before.subscription);
    await f.rpc('app_onboarding_save', [randomUUID(), 'independent', 1, false]);
    context = await f.rpc('app_onboarding_context');
    assert.equal(context.preference.version, 2);
    assert.equal(context.preference.reviewed_at, null);
    await assert.rejects(
      f.rpc('app_onboarding_save', [randomUUID(), 'producer', 1, true]),
      /outro dispositivo/,
    );
    await assert.rejects(
      f.rpc('app_onboarding_save', [randomUUID(), 'platform_admin', 2, false]),
      /roteiro/,
    );
    await f.as(f.user);
    assert.equal((await f.rpc('app_onboarding_context')).preference, null);
    await assert.rejects(f.db.query('select * from app_onboarding_preferences'));
    await f.as('', 'anon');
    await assert.rejects(f.rpc('app_onboarding_context'));
    await f.as('', 'authenticated');
    await assert.rejects(f.rpc('app_onboarding_context'), /Entre/);
  } finally {
    await f.db.close();
  }
});
test('vínculos ativos delimitam empresas e visitas; revogação retira gestão do roteiro', async () => {
  const f = await profileOnboardingFixture();
  try {
    await f.db.exec('reset role');
    const membership = randomUUID(),
      unrelated = randomUUID();
    await f.db.query(
      "insert into commerce_memberships(id,seller_id,user_id,active,management_role) values($1,$2,$3,true,'manager')",
      [membership, f.seller, f.other],
    );
    await f.db.query(
      "insert into commerce_sellers(id,owner_id,kind,name) values($1,$2,'company','Empresa isolada')",
      [unrelated, f.ids[10]],
    );
    await f.db.query(
      'insert into technical_visits values($1,$2,$3,null),($4,$2,$5,null),($6,$7,$3,null),($8,$2,null,null),($9,$2,null,now())',
      [
        randomUUID(),
        f.other,
        f.seller,
        randomUUID(),
        unrelated,
        randomUUID(),
        f.user,
        randomUUID(),
        randomUUID(),
      ],
    );
    await f.db.query(
      "insert into property_shares values($1,$2,$3,'active'),($4,$2,$5,'active'),($6,$2,$3,'revoked')",
      [randomUUID(), f.property, f.other, randomUUID(), f.user, randomUUID()],
    );
    await f.as(f.other);
    let context = await f.rpc('app_onboarding_context');
    assert.deepEqual(context.companies, [
      { id: f.seller, name: 'Empresa de teste', role: 'manager' },
    ]);
    assert.equal(context.counts.company_visits, 1);
    assert.equal(context.counts.personal_visits, 1);
    assert.equal(context.counts.shared_properties, 1);
    assert.equal(suggestedProfile(context), 'manager');
    await f.rpc('app_onboarding_save', [randomUUID(), 'manager', 0, false]);
    await f.db.exec('reset role');
    await f.db.query('update commerce_memberships set active=false where id=$1', [membership]);
    await f.as(f.other);
    context = await f.rpc('app_onboarding_context');
    assert.equal(context.preference.profile, 'manager');
    assert.equal(context.companies.length, 0);
    assert.equal(context.counts.company_visits, 0);
    assert.equal(
      profileSteps('manager', context, true).find((s) => s.id === 'workspace').href,
      '/consultor',
    );
    await f.as(f.user);
    context = await f.rpc('app_onboarding_context');
    assert.equal(context.companies[0].role, 'owner');
    assert.equal(context.counts.active_colleagues, 0);
  } finally {
    await f.db.close();
  }
});
test('etapas agrícolas refletem dados atuais; preparo offline é por dispositivo e não declaração salva', async () => {
  const f = await profileOnboardingFixture();
  try {
    await f.as(f.user);
    let context = await f.rpc('app_onboarding_context');
    let steps = profileSteps('producer', context, false);
    assert.equal(steps.find((s) => s.id === 'property').done, true);
    assert.equal(steps.find((s) => s.id === 'cycle').done, true);
    assert.equal(steps.find((s) => s.id === 'offline').done, false);
    await f.rpc('app_onboarding_save', [randomUUID(), 'producer', 0, true]);
    await f.db.exec(
      'reset role;update properties set deleted_at=now();update agricultural_inputs set active=false;',
    );
    await f.as(f.user);
    context = await f.rpc('app_onboarding_context');
    steps = profileSteps('producer', context, true);
    assert.equal(steps.find((s) => s.id === 'property').done, false);
    assert.equal(steps.find((s) => s.id === 'input').done, false);
    assert.equal(steps.find((s) => s.id === 'offline').done, true);
    assert.ok(context.preference.reviewed_at);
    assert.equal(
      profileSteps('producer', context, false).find((s) => s.id === 'offline').done,
      false,
    );
    assert.equal(
      profileSteps('independent', context, false).find((s) => s.id === 'sharing').optional,
      true,
    );
  } finally {
    await f.db.close();
  }
});

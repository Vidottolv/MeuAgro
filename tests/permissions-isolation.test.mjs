import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { permissionsFixture } from './permissions-fixture.mjs';

test('relatório anterior não contorna a autorização financeira do gerente', async () => {
  const f = await permissionsFixture({ install: false });
  try {
    await f.sale();
    await f.as(2);
    const before = await f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0]);
    assert.equal(before.totals.commission_total, 10); // Reproduces the legacy exposure.
    await f.migrate();
    await f.as(2);
    let report = await f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0]);
    assert.equal(report.commission_visible, false);
    assert.equal(report.totals.sales_total, 100);
    for (const key of ['commission_total', 'cost_total', 'result_total'])
      assert.equal(Object.hasOwn(report.totals, key), false);
    for (const key of [
      'commission_amount',
      'commission_percent',
      'version',
      'product_cost',
      'result_amount',
    ])
      assert.equal(Object.hasOwn(report.orders[0], key), false);
    await assert.rejects(
      f.rpc('trade_sales_report_before_permissions', [f.seller, f.from, f.to, 0]),
    );
    assert.deepEqual(await f.rows('trade_financial_versions'), []);
    await f.role(2, true);
    await f.as(2);
    report = await f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0]);
    assert.equal(report.commission_visible, true);
    assert.equal(report.orders[0].commission_amount, 10);
    const managed = await f.rpc('management_report', [f.seller, f.from, f.to, {}, 0]);
    assert.equal(managed.finance, true);
    assert.equal(managed.totals.commission, 10);
    await f.role(2, false);
    await f.as(2);
    assert.equal(
      (await f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0])).commission_visible,
      false,
    );
    await f.as(1);
    assert.equal(
      (await f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0])).totals.cost_total,
      40,
    );
    const member = (await f.rows('commerce_memberships')).find((m) => m.user_id === f.ids[1]);
    await f.rpc('management_team_command', [
      'set_role',
      {
        seller_id: f.seller,
        membership_id: member.id,
        expected_role: 'manager',
        expected_finance: false,
        role: 'representative',
        finance: false,
      },
      randomUUID(),
    ]);
    await f.as(2);
    const ownSales = await f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0]);
    assert.equal(ownSales.commission_visible, true);
    assert.equal(ownSales.totals.commission_total, 10);
    assert.equal(Object.hasOwn(ownSales.totals, 'cost_total'), false);
  } finally {
    await f.db.close();
  }
});
test('matriz de empresas: sessão, papel, delegação, escrita direta e isolamento de IDs', async () => {
  const f = await permissionsFixture();
  try {
    for (const [n, role, manage, finance] of [
      [1, 'owner', true, true],
      [2, 'manager', true, false],
      [3, 'representative', false, false],
    ]) {
      await f.as(n);
      const c = (await f.rpc('app_permissions_context')).companies;
      assert.equal(c.length, 1);
      assert.equal(c[0].id, f.seller);
      assert.equal(c[0].role, role);
      assert.equal(c[0].can_manage, manage);
      assert.equal(c[0].can_finance, finance);
      await assert.rejects(f.rpc('management_team', [f.foreignSeller]));
      await assert.rejects(f.rpc('management_report', [f.foreignSeller, f.from, f.to, {}, 0]));
    }
    await f.as(4);
    assert.deepEqual((await f.rpc('app_permissions_context')).companies, []);
    await f.as(3);
    await assert.rejects(f.rpc('management_team', [f.seller]));
    await assert.rejects(
      f.db.query(
        "update commerce_memberships set management_role='manager',can_view_finance=true where user_id=$1",
        [f.ids[2]],
      ),
    );
    await f.as(2);
    await assert.rejects(
      f.rpc('management_team_command', [
        'invite',
        { seller_id: f.seller, email: 'user6@example.test', role: 'manager', finance: true },
        randomUUID(),
      ]),
    );
    await assert.rejects(
      f.rpc('commerce_command_before_team', [
        'invite',
        { seller_id: f.seller, email: 'user6@example.test' },
      ]),
    );
    await assert.rejects(
      f.rpc('trade_command_before_management', ['send_quote', {}, randomUUID()]),
    );
    await f.as(1);
    const m = (await f.rows('commerce_memberships')).find((x) => x.user_id === f.ids[1]);
    await f.rpc('management_team_command', [
      'remove_member',
      {
        seller_id: f.seller,
        membership_id: m.id,
        expected_role: m.management_role,
        expected_finance: m.can_view_finance,
      },
      randomUUID(),
    ]);
    await f.as(2);
    assert.deepEqual((await f.rpc('app_permissions_context')).companies, []);
    await assert.rejects(f.rpc('management_team', [f.seller]));
    await assert.rejects(f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0]));
    await f.as(null, 'anon');
    await assert.rejects(f.rpc('app_permissions_context'));
    await assert.rejects(f.rpc('trade_sales_report', [f.seller, f.from, f.to, 0]));
  } finally {
    await f.db.close();
  }
});
test('visitas e fotos: particular, equipe, produtor, empresa alheia e vínculo revogado', async () => {
  const f = await permissionsFixture();
  try {
    const personal = await f.visit(3),
      company = await f.visit(3, true);
    const photo = randomUUID(),
      path = f.ids[2] + '/' + company + '/' + photo + '.jpg';
    await f.as(3);
    await f.db.query(
      "insert into storage.objects(bucket_id,name) values('meu-agro-visit-photos',$1)",
      [path],
    );
    await f.rpc('sync_visit_operation', [
      f.ids[2],
      photo,
      {
        kind: 'visit_photo',
        photo: {
          id: photo,
          visit_id: company,
          storage_path: path,
          description: 'Problema observado',
        },
      },
    ]);
    for (const [n, privateRead, companyRead] of [
      [1, false, true],
      [2, false, true],
      [3, true, true],
      [4, false, false],
      [5, false, false],
    ]) {
      await f.as(n);
      assert.equal(await f.rpc('technical_visit_can_read', [personal]), privateRead);
      assert.equal(await f.rpc('technical_visit_can_read', [company]), companyRead);
      assert.equal(
        (await f.db.query('select id from technical_visits where id=$1', [company])).rows.length,
        companyRead ? 1 : 0,
      );
      assert.equal(
        (await f.db.query('select name from storage.objects where name=$1', [path])).rows.length,
        companyRead ? 1 : 0,
      );
    }
    await f.as(2);
    await assert.rejects(
      f.rpc('sync_visit_operation', [
        f.ids[2],
        randomUUID(),
        { kind: 'visit_photo', photo: { id: randomUUID(), visit_id: company, storage_path: path } },
      ]),
    );
    await f.as(1);
    const m = (await f.rows('commerce_memberships')).find((x) => x.user_id === f.ids[2]);
    await f.rpc('management_team_command', [
      'remove_member',
      {
        seller_id: f.seller,
        membership_id: m.id,
        expected_role: m.management_role,
        expected_finance: m.can_view_finance,
      },
      randomUUID(),
    ]);
    await f.as(3);
    assert.equal(await f.rpc('technical_visit_can_read', [company]), false);
    assert.equal(await f.rpc('technical_visit_can_read', [personal]), true);
    assert.equal(
      (await f.db.query('select name from storage.objects where name=$1', [path])).rows.length,
      0,
    );
  } finally {
    await f.db.close();
  }
});
test('vínculo comercial não libera propriedade do produtor; compartilhamento exige aceite e é revogável', async () => {
  const f = await permissionsFixture();
  try {
    await f.as(2);
    assert.deepEqual(
      (await f.db.query('select * from properties where id=$1', [f.property])).rows,
      [],
    );
    await f.as(4);
    const share = await f.rpc('property_share_command', [
      'invite',
      { property_id: f.property, email: 'user5@example.test' },
    ]);
    await f.as(5);
    await assert.rejects(f.rpc('property_share_detail', [share.id]));
    await f.rpc('property_share_command', ['accept', { id: share.id }]);
    assert.equal((await f.rpc('property_share_detail', [share.id])).property.id, f.property);
    assert.deepEqual(
      (await f.db.query('select * from properties where id=$1', [f.property])).rows,
      [],
    );
    await f.as(2);
    await assert.rejects(f.rpc('property_share_detail', [share.id]));
    await f.as(4);
    await f.rpc('property_share_command', ['revoke', { id: share.id }]);
    await f.as(5);
    await assert.rejects(f.rpc('property_share_detail', [share.id]));
  } finally {
    await f.db.close();
  }
});

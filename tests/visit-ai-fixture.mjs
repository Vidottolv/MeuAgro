import { permissionsFixture } from './permissions-fixture.mjs';
import { readFileSync } from 'node:fs';
export async function visitAiFixture() {
  const f = await permissionsFixture();
  await f.db.exec('reset role');
  const sql = readFileSync(new URL('../supabase/stage_58_visit_ai.sql', import.meta.url), 'utf8');
  await f.db.exec(sql);
  await f.db.exec(sql);
  await f.db.exec(
    "update visit_ai_settings set enabled=true; alter table technical_visits add column if not exists field_observations jsonb default '[]';",
  );
  for (const id of f.ids)
    await f.db.query('insert into visit_ai_entitlements(user_id,enabled) values($1,true)', [id]);
  return f;
}

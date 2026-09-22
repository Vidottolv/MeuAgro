import {salesFixture} from './sales-fixture.mjs';
import fs from 'node:fs';
export async function improvementsFixture(){
 const f=await salesFixture();await f.db.exec('create role service_role; grant usage on schema public to service_role;');
 const commerceMigration=fs.readFileSync(new URL('../supabase/upgrade_0_23_commerce.sql',import.meta.url),'utf8');
 const pushMigration=fs.readFileSync(new URL('../supabase/upgrade_0_23_push.sql',import.meta.url),'utf8');
 await f.db.exec(commerceMigration);await f.db.exec(pushMigration);
 return {...f,commerceMigration,pushMigration};
}

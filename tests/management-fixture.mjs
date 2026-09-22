import {improvementsFixture} from './improvements-fixture.mjs';
import fs from 'node:fs';
export async function managementFixture(){const f=await improvementsFixture();const migration=fs.readFileSync(new URL('../supabase/upgrade_0_25_management.sql',import.meta.url),'utf8');await f.db.exec(migration);return {...f,migration};}

import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
export async function tradeFixture(stage3=false) {
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to authenticated,anon;
 create table public.properties(id uuid primary key,user_id uuid references auth.users(id),name text,deleted_at timestamptz);
 alter table public.properties enable row level security;
 create policy own_properties on public.properties for select to authenticated using(user_id=auth.uid());
 grant select on public.properties to authenticated;`);
 const ids=[1,2,3,4,5,6].map(n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`);
 for(let i=0;i<ids.length;i++)await db.query('insert into auth.users values($1,$2,$3)',[ids[i],`user${i+1}@example.test`,i===5?null:new Date()]);
 await db.query('insert into public.properties values($1,$2,$3,null)',['10000000-0000-4000-8000-000000000001',ids[3],'Fazenda do produtor']);
 let migration=fs.readFileSync(new URL('../supabase/stage_26_catalog_quotes.sql',import.meta.url),'utf8');
 await db.exec(fs.readFileSync(new URL('../supabase/stage_25_commerce_foundation.sql',import.meta.url),'utf8'));
 await db.exec(migration);
 if(stage3){migration=fs.readFileSync(new URL('../supabase/stage_27_orders_messages.sql',import.meta.url),'utf8');await db.exec(migration);}
 const as=async(n,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[n?ids[n-1]:'']);await db.exec(`set role ${role}`);};
 const commerce=async(action,data={})=>(await db.query('select public.commerce_command($1,$2::jsonb) r',[action,JSON.stringify(data)])).rows[0].r;
 const command=async(action,data={},operation=randomUUID())=>(await db.query('select public.trade_command($1,$2::jsonb,$3::uuid) r',[action,JSON.stringify(data),operation])).rows[0].r;
 const rows=async(table)=>(await db.query('select * from public.'+table)).rows;
 return {db,ids,as,commerce,command,rows,migration};
}

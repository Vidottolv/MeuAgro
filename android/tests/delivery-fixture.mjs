import {tradeFixture} from './trade-fixture.mjs';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';

// Contrato mínimo do barracão, baseado nos campos usados pelos serviços existentes.
// A entrada automática e a imutabilidade são carregadas da migração real 14/15.
export async function deliveryFixture(){
 const f=await tradeFixture(true),{db}=f;
 await db.exec(`
 create table public.agricultural_inputs(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),name text not null,brand text,category text not null,base_unit text not null,minimum_stock numeric default 0,ideal_stock numeric,active boolean not null default true,deleted_at timestamptz);
 create table public.inventory_lots(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),agricultural_input_id uuid not null references public.agricultural_inputs(id),supplier text,purchased_quantity numeric(14,4) not null check(purchased_quantity>0),unit text not null,total_price numeric(16,2) not null check(total_price>=0),unit_price numeric generated always as (total_price/purchased_quantity) stored,purchase_date date not null,expiration_date date,batch_number text,notes text,deleted_at timestamptz);
 create table public.inventory_transactions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),agricultural_input_id uuid not null references public.agricultural_inputs(id),inventory_lot_id uuid not null references public.inventory_lots(id),transaction_type text not null,quantity numeric(14,4) not null,unit text not null,unit_cost numeric,total_cost numeric,occurred_at timestamptz,notes text,created_at timestamptz default now());
 create function public.inventory_transaction_sign(text) returns numeric language sql immutable as $$select case when $1 in ('entry','adjustment_in') then 1 else -1 end$$;
 create view public.inventory_lot_balances with(security_invoker=true) as select inventory_lot_id,sum(quantity) current_quantity from public.inventory_transactions group by inventory_lot_id;
 create view public.inventory_balances with(security_invoker=true) as select agricultural_input_id,sum(quantity) current_quantity from public.inventory_transactions group by agricultural_input_id;
 `);
 for(const table of ['agricultural_inputs','inventory_lots','inventory_transactions'])await db.exec(`alter table public.${table} enable row level security;create policy own_rows on public.${table} for select to authenticated using(user_id=auth.uid());grant select on public.${table} to authenticated;`);
 await db.exec(fs.readFileSync(new URL('../supabase/stage_14_15_inventory_lots_transactions.sql',import.meta.url),'utf8'));
 const migration=fs.readFileSync(new URL('../supabase/stage_28_delivery_notifications.sql',import.meta.url),'utf8');await db.exec(migration);
 const fulfillment=async(action,data,op=randomUUID())=>(await db.query('select public.fulfillment_command($1,$2::jsonb,$3::uuid) r',[action,JSON.stringify(data),op])).rows[0].r;
 const inbox=async()=>(await db.query('select public.trade_notification_inbox() r')).rows[0].r;
 return {...f,migration,fulfillment,inbox};
}

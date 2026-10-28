begin;
do $$ begin
 if to_regprocedure('public.validate_harvest_sale()') is null or
    to_regprocedure('public.operating_cost_report(uuid,uuid,uuid,integer)') is null or
    not exists(select 1 from pg_trigger where tgrelid='public.harvest_sales'::regclass and tgname='trg_validate_harvest_sale' and tgenabled<>'D') then
  raise exception 'Instale as etapas 21/22 e 43/44 antes da conferência agrícola.';
 end if;
end;$$;
create or replace function public.farm_harvest_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
declare c public.production_cycles%rowtype;
begin
 select * into c from public.production_cycles where id=new.production_cycle_id and user_id=new.user_id for update;
 if not found then raise exception 'Plantio indisponível para esta colheita.';end if;
 if tg_op='UPDATE' then
  if exists(select 1 from public.harvest_sales where harvest_id=new.id and sale_date<new.harvest_date) then raise exception 'A colheita não pode ficar depois de uma venda já registrada.';end if;
  if c.status='harvested' and new.harvest_date>c.final_harvest_date then raise exception 'A colheita não pode ultrapassar a data de encerramento do plantio.';end if;
 end if;
 return new;
end;$$;
create or replace function public.farm_sale_lock() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.harvests where id=new.harvest_id and user_id=new.user_id for update;
 if not found then raise exception 'Colheita indisponível para esta venda.';end if;
 return new;
end;$$;
create or replace function public.farm_cycle_close_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
declare last_day date;
begin
 if new.status='harvested' then
  select max(harvest_date) into last_day from public.harvests where production_cycle_id=new.id and user_id=new.user_id;
  if last_day is not null and (new.final_harvest_date is null or new.final_harvest_date<last_day) then raise exception 'O encerramento não pode ficar antes da última colheita registrada.';end if;
 end if;
 return new;
end;$$;
drop trigger if exists aa_farm_harvest_guard on public.harvests;
create trigger aa_farm_harvest_guard before insert or update on public.harvests for each row execute function public.farm_harvest_guard();
drop trigger if exists aa_farm_sale_lock on public.harvest_sales;
create trigger aa_farm_sale_lock before insert or update on public.harvest_sales for each row execute function public.farm_sale_lock();
drop trigger if exists aa_farm_cycle_close_guard on public.production_cycles;
create trigger aa_farm_cycle_close_guard before update of status,final_harvest_date on public.production_cycles for each row execute function public.farm_cycle_close_guard();
create or replace function public.finalize_cycle_from_harvest(p_harvest_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare c public.production_cycles%rowtype;last_day date;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select pc.* into c from public.production_cycles pc join public.harvests h on h.production_cycle_id=pc.id
 where h.id=p_harvest_id and h.user_id=auth.uid() and pc.user_id=auth.uid() for update of pc;
 if not found then raise exception 'Colheita indisponível nesta conta.' using errcode='42501';end if;
 if c.status in ('closed','cancelled') or c.deleted_at is not null then raise exception 'Este plantio não permite encerramento por colheita.';end if;
 select max(harvest_date) into last_day from public.harvests where production_cycle_id=c.id and user_id=auth.uid();
 update public.production_cycles set status='harvested',final_harvest_date=last_day where id=c.id;
 return c.id;
end;$$;
create or replace function public.app_farm_workflow(p_cycle uuid default null,p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_cycle is not null and not exists(select 1 from public.production_cycles where id=p_cycle and user_id=auth.uid()) then raise exception 'Plantio indisponível nesta conta.' using errcode='42501';end if;
 result:=public.operating_cost_report(null,null,p_cycle,p_offset);
 return result||jsonb_build_object('checks',coalesce((
 select jsonb_agg(jsonb_build_object('id',pc.id,'status',pc.status,'final_harvest_date',pc.final_harvest_date,
 'has_season',pc.season_id is not null,'has_area',pc.area_id is not null,'has_crop',pc.crop_id is not null,
 'events',(select count(*) from public.production_events e where e.production_cycle_id=pc.id and e.user_id=auth.uid()),
 'usages',(select count(*) from public.inventory_transactions t where t.production_cycle_id=pc.id and t.user_id=auth.uid() and t.transaction_type='usage'),
 'harvests',(select count(*) from public.harvests h where h.production_cycle_id=pc.id and h.user_id=auth.uid()),
 'sales',(select count(*) from public.harvest_sales s join public.harvests h on h.id=s.harvest_id where h.production_cycle_id=pc.id and h.user_id=auth.uid() and s.user_id=auth.uid()),
 'issues',(select count(*) from public.harvests h where h.production_cycle_id=pc.id and h.user_id=auth.uid() and (
 h.harvest_date<pc.planting_date or h.quantity<(select coalesce(sum(s.quantity),0) from public.harvest_sales s where s.harvest_id=h.id and s.user_id=auth.uid()) or
 exists(select 1 from public.harvest_sales s where s.harvest_id=h.id and s.user_id=auth.uid() and (s.sale_date<h.harvest_date or s.unit<>h.unit)) or
 (pc.status='harvested' and (pc.final_harvest_date is null or pc.final_harvest_date<h.harvest_date))))
 ) order by pc.id)
 from public.production_cycles pc where pc.user_id=auth.uid() and pc.id in (select (x->>'id')::uuid from jsonb_array_elements(result->'items')x)
 ),'[]'::jsonb));
end;$$;
revoke all on function public.farm_harvest_guard(),public.farm_sale_lock(),public.farm_cycle_close_guard(),public.finalize_cycle_from_harvest(uuid),public.app_farm_workflow(uuid,integer) from public,anon,authenticated;
grant execute on function public.finalize_cycle_from_harvest(uuid),public.app_farm_workflow(uuid,integer) to authenticated;
commit;

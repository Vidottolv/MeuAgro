-- ============================================================
-- MEU AGRO - ETAPA 10
-- Dashboard
-- ============================================================
--
-- Execute uma vez no SQL Editor do Supabase.
--
-- A função dashboard_summary() já nasceu na Etapa 1. Este script
-- reaplica sua versão esperada e acrescenta índices úteis para a
-- linha do tempo de atividades recentes.
--
-- O script é idempotente e não apaga dados.
-- ============================================================

begin;

create index if not exists
  idx_cycles_user_created_at
on public.production_cycles(
  user_id,
  created_at desc
)
where deleted_at is null;

create index if not exists
  idx_production_events_user_occurred_at
on public.production_events(
  user_id,
  occurred_at desc
);

create or replace function public.dashboard_summary()
returns table (
  properties_count bigint,
  active_areas_count bigint,
  active_cycles_count bigint,
  near_harvest_count bigint,
  low_stock_count bigint,
  month_harvests_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      select count(*)
      from public.properties p
      where p.user_id = auth.uid()
        and p.deleted_at is null
        and p.status = 'active'
    ),
    (
      select count(*)
      from public.areas a
      where a.user_id = auth.uid()
        and a.deleted_at is null
        and a.status = 'active'
    ),
    (
      select count(*)
      from public.production_cycles pc
      where pc.user_id = auth.uid()
        and pc.deleted_at is null
        and pc.status in (
          'planned',
          'planted',
          'developing',
          'near_harvest',
          'ready_to_harvest'
        )
    ),
    (
      select count(*)
      from public.production_cycles pc
      where pc.user_id = auth.uid()
        and pc.deleted_at is null
        and pc.status not in (
          'closed',
          'cancelled',
          'harvested'
        )
        and pc.current_harvest_forecast
          between current_date
          and current_date + 7
    ),
    (
      select count(*)
      from public.inventory_balances ib
      where ib.user_id = auth.uid()
        and ib.stock_status in (
          'low_stock',
          'out_of_stock'
        )
    ),
    (
      select count(*)
      from public.harvests h
      where h.user_id = auth.uid()
        and date_trunc(
          'month',
          h.harvest_date::timestamp
        ) = date_trunc(
          'month',
          current_date::timestamp
        )
    );
$$;

grant execute
on function public.dashboard_summary()
to authenticated;

commit;

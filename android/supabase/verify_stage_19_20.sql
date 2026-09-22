-- ============================================================
-- MEU AGRO - ETAPAS 19 E 20
-- Verificação - somente leitura
-- ============================================================

-- 1. Preferências
select
  user_id,
  harvest_reminders_enabled,
  harvest_reminder_hour,
  harvest_reminder_minute,
  harvest_alert_days_before,
  timezone,
  updated_at
from public.notification_preferences
order by updated_at desc;

-- 2. Estrutura da fila
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'notifications'
order by ordinal_position;

-- 3. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'notification_preferences',
    'notifications'
  )
order by tablename;

-- 4. Policies
select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'notification_preferences',
    'notifications'
  )
order by tablename, policyname;

-- 5. Função da fila
select
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name =
    'refresh_harvest_notification_queue';

-- 6. Índices
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and (
    tablename = 'notifications'
    or (
      tablename = 'production_cycles'
      and indexname like
        '%harvest%'
    )
  )
order by tablename, indexname;

-- 7. Ciclos que podem gerar aviso
select
  pc.id,
  p.name as property_name,
  a.name as area_name,
  c.name as crop_name,
  pc.current_harvest_forecast,
  pc.status,
  (
    pc.current_harvest_forecast
    - current_date
  ) as days_to_harvest
from public.production_cycles pc
join public.properties p
  on p.id = pc.property_id
join public.areas a
  on a.id = pc.area_id
join public.crops c
  on c.id = pc.crop_id
where pc.deleted_at is null
  and pc.current_harvest_forecast
    is not null
  and pc.status not in (
    'harvested',
    'closed',
    'cancelled'
  )
order by
  pc.current_harvest_forecast;

-- 8. Fila atual do usuário que executar o SQL
-- No SQL Editor auth.uid() normalmente é NULL por executar
-- com papel administrativo; por isso a consulta abaixo mostra
-- todos os registros para inspeção administrativa.
select
  id,
  user_id,
  production_cycle_id,
  title,
  scheduled_for,
  delivered_at,
  read_at,
  cancelled_at,
  metadata
from public.notifications
where notification_type =
  'harvest_reminder'
order by scheduled_for
limit 100;

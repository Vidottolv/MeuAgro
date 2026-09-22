-- ============================================================
-- MEU AGRO - ETAPAS 19 E 20
-- Previsão de colheita + fila de notificações
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- A parte Android é local ao dispositivo. O banco mantém:
-- - preferências;
-- - fila de lembretes;
-- - estado entregue/lido/cancelado.
--
-- O aplicativo sincroniza essa fila com Local Notifications
-- quando estiver rodando dentro do Capacitor.
-- ============================================================

begin;

-- ============================================================
-- 1. PREFERÊNCIAS
-- ============================================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique
    references auth.users(id)
    on delete cascade,
  harvest_reminders_enabled boolean
    not null default true,
  harvest_reminder_hour smallint
    not null default 8
    check (
      harvest_reminder_hour
      between 0 and 23
    ),
  harvest_reminder_minute smallint
    not null default 0
    check (
      harvest_reminder_minute
      between 0 and 59
    ),
  harvest_alert_days_before integer
    not null default 7
    check (
      harvest_alert_days_before
      between 0 and 60
    ),
  timezone text
    not null default
      'America/Sao_Paulo',
  created_at timestamptz
    not null default now(),
  updated_at timestamptz
    not null default now()
);

-- ============================================================
-- 2. FILA / HISTÓRICO DE NOTIFICAÇÕES
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  production_cycle_id uuid
    references public.production_cycles(id)
    on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  scheduled_for timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb
    not null default '{}'::jsonb,
  created_at timestamptz
    not null default now()
);

create index if not exists
  idx_notifications_user_schedule
on public.notifications(
  user_id,
  scheduled_for
);

create unique index if not exists
  uq_notifications_harvest_schedule
on public.notifications(
  user_id,
  production_cycle_id,
  notification_type,
  scheduled_for
)
where production_cycle_id is not null;

create index if not exists
  idx_cycles_user_harvest_forecast
on public.production_cycles(
  user_id,
  current_harvest_forecast
)
where
  deleted_at is null
  and current_harvest_forecast
    is not null;

-- ============================================================
-- 3. RLS
-- ============================================================

alter table
  public.notification_preferences
enable row level security;

alter table
  public.notifications
enable row level security;

drop policy if exists
  notification_preferences_all_own
on public.notification_preferences;

create policy
  notification_preferences_all_own
on public.notification_preferences
for all
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

drop policy if exists
  notifications_all_own
on public.notifications;

create policy
  notifications_all_own
on public.notifications
for all
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- ============================================================
-- 4. UPDATED_AT DAS PREFERÊNCIAS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists
  trg_notification_preferences_updated_at
on public.notification_preferences;

create trigger
  trg_notification_preferences_updated_at
before update
on public.notification_preferences
for each row
execute function
  public.set_updated_at();

-- ============================================================
-- 5. FUNÇÃO DE SINCRONIZAÇÃO DA FILA
-- ============================================================
--
-- Regra:
--
-- previsão - antecedência
--            ↓
-- início dos lembretes
--            ↓
-- 1 lembrete por dia
--            ↓
-- continua após a previsão se o ciclo
-- ainda não estiver concluído.
--
-- A fila usa horizonte móvel de até 60 dias.
-- Cada abertura/sincronização do aplicativo renova o horizonte.
--
-- O horário é construído usando o timezone da preferência.
-- ============================================================

create or replace function
  public.refresh_harvest_notification_queue(
    p_horizon_days integer default 30
  )
returns setof public.notifications
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid :=
    auth.uid();

  v_enabled boolean;
  v_hour smallint;
  v_minute smallint;
  v_days_before integer;
  v_timezone text;

  v_today date;
  v_horizon integer;
  v_now timestamptz :=
    now();
begin
  if v_user_id is null then
    return;
  end if;

  insert into
    public.notification_preferences (
      user_id
    )
  values (
    v_user_id
  )
  on conflict (
    user_id
  )
  do nothing;

  select
    harvest_reminders_enabled,
    harvest_reminder_hour,
    harvest_reminder_minute,
    harvest_alert_days_before,
    timezone
  into
    v_enabled,
    v_hour,
    v_minute,
    v_days_before,
    v_timezone
  from
    public.notification_preferences
  where
    user_id = v_user_id;

  v_timezone :=
    coalesce(
      nullif(
        trim(v_timezone),
        ''
      ),
      'America/Sao_Paulo'
    );

  v_horizon :=
    greatest(
      1,
      least(
        coalesce(
          p_horizon_days,
          30
        ),
        60
      )
    );

  begin
    v_today :=
      (
        v_now
        at time zone
          v_timezone
      )::date;
  exception
    when invalid_parameter_value then
      v_timezone :=
        'America/Sao_Paulo';

      v_today :=
        (
          v_now
          at time zone
            v_timezone
        )::date;
  end;

  -- Tudo que ainda estava pendente é cancelado.
  -- Na sequência, apenas os lembretes ainda válidos
  -- são reativados/inseridos.
  update
    public.notifications
  set
    cancelled_at =
      v_now
  where
    user_id =
      v_user_id
    and notification_type =
      'harvest_reminder'
    and scheduled_for >
      v_now
    and delivered_at
      is null
    and cancelled_at
      is null;

  if not coalesce(
    v_enabled,
    true
  ) then
    return;
  end if;

  insert into public.notifications (
    user_id,
    production_cycle_id,
    notification_type,
    title,
    body,
    scheduled_for,
    cancelled_at,
    metadata
  )
  select
    v_user_id,

    pc.id,

    'harvest_reminder',

    case
      when
        pc.current_harvest_forecast
        < gs.day::date
      then
        'Previsão de colheita atrasada'

      when
        pc.current_harvest_forecast
        = gs.day::date
      then
        'Colheita prevista para hoje'

      else
        'Colheita se aproximando'
    end,

    case
      when
        pc.current_harvest_forecast
        < gs.day::date
      then
        format(
          'A previsão de %s em %s passou há %s dia(s). Verifique se o ciclo já está pronto para colher.',
          c.name,
          a.name,
          (
            gs.day::date
            - pc.current_harvest_forecast
          )
        )

      when
        pc.current_harvest_forecast
        = gs.day::date
      then
        format(
          'A colheita de %s em %s está prevista para hoje.',
          c.name,
          a.name
        )

      else
        format(
          'Faltam %s dia(s) para a previsão de colheita de %s em %s.',
          (
            pc.current_harvest_forecast
            - gs.day::date
          ),
          c.name,
          a.name
        )
    end,

    (
      (
        gs.day::date
        +
        make_time(
          v_hour,
          v_minute,
          0
        )
      )
      at time zone
        v_timezone
    ),

    null,

    jsonb_build_object(
      'route',
      format(
        '/plantings/%s',
        pc.id
      ),
      'forecast_date',
      pc.current_harvest_forecast,
      'crop_name',
      c.name,
      'area_name',
      a.name,
      'property_name',
      p.name,
      'timezone',
      v_timezone,
      'days_to_harvest',
      (
        pc.current_harvest_forecast
        - gs.day::date
      )
    )

  from
    public.production_cycles pc

  join public.crops c
    on c.id =
      pc.crop_id

  join public.areas a
    on a.id =
      pc.area_id

  join public.properties p
    on p.id =
      pc.property_id

  cross join lateral
    generate_series(
      greatest(
        v_today,
        pc.current_harvest_forecast
        - v_days_before
      ),
      v_today + v_horizon,
      interval '1 day'
    ) as gs(day)

  where
    pc.user_id =
      v_user_id

    and pc.deleted_at
      is null

    and pc.current_harvest_forecast
      is not null

    and pc.status not in (
      'harvested',
      'closed',
      'cancelled'
    )

    -- Não cria lembretes de um ciclo cuja janela
    -- ainda começa depois do horizonte móvel.
    and (
      pc.current_harvest_forecast
      - v_days_before
    ) <=
      (
        v_today
        + v_horizon
      )

    -- Evita tentar agendar horário que já passou hoje.
    and (
      (
        gs.day::date
        +
        make_time(
          v_hour,
          v_minute,
          0
        )
      )
      at time zone
        v_timezone
    ) > v_now

  on conflict (
    user_id,
    production_cycle_id,
    notification_type,
    scheduled_for
  )
  where
    production_cycle_id
      is not null
  do update
  set
    title =
      excluded.title,
    body =
      excluded.body,
    cancelled_at =
      null,
    metadata =
      excluded.metadata;

  return query
  select
    n.*
  from
    public.notifications n
  where
    n.user_id =
      v_user_id
    and n.notification_type =
      'harvest_reminder'
    and n.scheduled_for >
      v_now
    and n.cancelled_at
      is null
    and n.delivered_at
      is null
  order by
    n.scheduled_for;
end;
$$;

revoke all
on function
  public.refresh_harvest_notification_queue(
    integer
  )
from public;

grant execute
on function
  public.refresh_harvest_notification_queue(
    integer
  )
to authenticated;

commit;

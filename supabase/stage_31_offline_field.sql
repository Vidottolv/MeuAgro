-- Apply after the existing production/event/photo migrations, before publishing the app.
begin;
create table if not exists public.offline_field_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id, operation_id)
);
alter table public.offline_field_operations enable row level security;
drop policy if exists offline_field_read_own on public.offline_field_operations;
create policy offline_field_read_own on public.offline_field_operations for select to authenticated using (user_id = auth.uid());
revoke all on public.offline_field_operations from anon, authenticated;
grant select on public.offline_field_operations to authenticated;

create or replace function public.sync_field_operation(p_user uuid, p_operation uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_previous public.offline_field_operations%rowtype;
  v_cycle public.production_cycles%rowtype;
  v_event jsonb := p_payload->'event';
  v_photo jsonb := p_payload->'photo';
  v_kind text := p_payload->>'kind';
  v_cycle_id uuid;
  v_event_id uuid;
  v_result jsonb;
begin
  if v_user is null or p_user is distinct from v_user or p_operation is null then
    raise exception 'Entre na conta que criou o registro para sincronizar.' using errcode = '42501';
  end if;
  if p_payload is null or v_kind is null or v_kind not in ('event', 'photo') or octet_length(p_payload::text) > 30000 then
    raise exception 'Operação offline inválida.';
  end if;
  -- Serialize the same operation across devices/tabs; ledger and rows commit atomically.
  perform pg_advisory_xact_lock(hashtext(v_user::text), hashtext(p_operation::text));
  select * into v_previous from public.offline_field_operations where user_id = v_user and operation_id = p_operation;
  if found then
    if v_previous.payload is distinct from p_payload then raise exception 'O identificador já foi usado por outro registro.'; end if;
    return v_previous.result;
  end if;
  if v_kind = 'event' then
    if (v_event->>'id')::uuid is distinct from p_operation then raise exception 'Identificador de evento inválido.'; end if;
    v_cycle_id := (v_event->>'production_cycle_id')::uuid;
  else
    if (v_photo->>'id')::uuid is distinct from p_operation then raise exception 'Identificador de foto inválido.'; end if;
    v_cycle_id := (v_photo->>'production_cycle_id')::uuid;
  end if;
  select * into v_cycle from public.production_cycles where id = v_cycle_id and user_id = v_user and deleted_at is null for share;
  if not found then raise exception 'O plantio não está mais disponível para sua conta. O registro local foi preservado.' using errcode = '42501'; end if;
  if v_event is not null and v_event <> 'null'::jsonb then
    if (v_event->>'production_cycle_id')::uuid is distinct from v_cycle.id
      or length(btrim(coalesce(v_event->>'title', ''))) not between 1 and 180
      or length(coalesce(v_event->>'description', '')) > 1600
      or length(coalesce(v_event->>'notes', '')) > 1600 then
      raise exception 'Dados do evento inválidos.';
    end if;
    v_event_id := (v_event->>'id')::uuid;
    if v_event_id is null or v_event->>'occurred_at' is null then raise exception 'Informe o evento e sua data.'; end if;
    insert into public.production_events(id, user_id, production_cycle_id, event_type, title, description, notes, occurred_at)
    values(v_event_id, v_user, v_cycle.id, v_event->>'event_type', btrim(v_event->>'title'), nullif(v_event->>'description',''), nullif(v_event->>'notes',''), (v_event->>'occurred_at')::timestamptz);
  elsif v_kind = 'event' then
    raise exception 'Evento ausente.';
  end if;
  if v_kind = 'photo' then
    if (v_photo->>'property_id')::uuid is distinct from v_cycle.property_id
      or (v_photo->>'area_id')::uuid is distinct from v_cycle.area_id
      or length(coalesce(v_photo->>'description', '')) > 1600
      or v_photo->>'captured_at' is null
      or coalesce(v_photo->>'storage_path','') !~ ('^' || v_user::text || '/' || v_cycle.property_id::text || '/' || v_cycle.id::text || '/' || p_operation::text || '\.(jpg|png|webp)$') then
      raise exception 'Referências da foto inválidas.';
    end if;
    v_event_id := nullif(v_photo->>'production_event_id','')::uuid;
    if v_event_id is not null and not exists (
      select 1 from public.production_events where id = v_event_id and user_id = v_user and production_cycle_id = v_cycle.id
    ) then raise exception 'O evento da foto não pertence a este plantio.'; end if;
    if v_event is not null and v_event <> 'null'::jsonb and (v_event->>'id')::uuid is distinct from v_event_id then raise exception 'Evento fotográfico divergente.'; end if;
    insert into public.event_photos(id, user_id, property_id, area_id, production_cycle_id, production_event_id, storage_path, description, captured_at)
    values(p_operation, v_user, v_cycle.property_id, v_cycle.area_id, v_cycle.id, v_event_id, v_photo->>'storage_path', nullif(v_photo->>'description',''), (v_photo->>'captured_at')::timestamptz);
  end if;
  v_result := jsonb_build_object('id', p_operation, 'synced', true);
  insert into public.offline_field_operations(user_id, operation_id, payload, result) values(v_user, p_operation, p_payload, v_result);
  return v_result;
end;
$$;
revoke all on function public.sync_field_operation(uuid, uuid, jsonb) from public, anon;
grant execute on function public.sync_field_operation(uuid, uuid, jsonb) to authenticated;
commit;

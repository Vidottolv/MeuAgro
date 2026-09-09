-- ============================================================
-- MEU AGRO - ETAPAS 8 E 9
-- Culturas + Ciclos Produtivos
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- A tabela crops, a tabela production_cycles, RLS, índices,
-- seeds e a validação inicial já foram criados na Etapa 1.
--
-- Este script melhora a validação do ciclo para preservar
-- históricos sem permitir novas referências inválidas.
-- ============================================================

begin;

create or replace function public.validate_production_cycle_references()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_property_user uuid;
  v_area_user uuid;
  v_area_property uuid;
  v_season_user uuid;
  v_season_property uuid;
  v_crop_user uuid;

  v_full_validation boolean := false;
  v_references_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    v_full_validation := true;
  else
    v_references_changed :=
      new.user_id is distinct from old.user_id
      or new.property_id is distinct from old.property_id
      or new.area_id is distinct from old.area_id
      or new.season_id is distinct from old.season_id
      or new.crop_id is distinct from old.crop_id;

    v_full_validation :=
      v_references_changed
      or (
        old.deleted_at is not null
        and new.deleted_at is null
      );
  end if;

  -- Em INSERT, restauração ou alteração de qualquer referência,
  -- todas as referências são verificadas novamente.
  --
  -- Em UPDATE comum (status, datas, observações etc.) com referências
  -- inalteradas, o ciclo histórico continua editável mesmo se uma
  -- cultura/área/propriedade tiver sido desativada/arquivada depois.

  if v_full_validation then
    select p.user_id
      into v_property_user
    from public.properties p
    where p.id = new.property_id
      and p.deleted_at is null;

    if v_property_user is null
       or v_property_user <> new.user_id then
      raise exception
        'Propriedade inválida para este usuário.';
    end if;

    select
      a.user_id,
      a.property_id
      into
        v_area_user,
        v_area_property
    from public.areas a
    where a.id = new.area_id
      and a.deleted_at is null;

    if v_area_user is null
       or v_area_user <> new.user_id
       or v_area_property <> new.property_id then
      raise exception
        'Área inválida para a propriedade informada.';
    end if;

    if new.season_id is not null then
      select
        s.user_id,
        s.property_id
        into
          v_season_user,
          v_season_property
      from public.seasons s
      where s.id = new.season_id
        and s.deleted_at is null;

      if v_season_user is null
         or v_season_user <> new.user_id
         or v_season_property <> new.property_id then
        raise exception
          'Safra inválida para a propriedade informada.';
      end if;
    end if;

    select c.user_id
      into v_crop_user
    from public.crops c
    where c.id = new.crop_id
      and c.active = true;

    if not found then
      raise exception
        'Cultura inválida ou inativa.';
    end if;

    if v_crop_user is not null
       and v_crop_user <> new.user_id then
      raise exception
        'Cultura personalizada pertence a outro usuário.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_production_cycle_references
on public.production_cycles;

create trigger
  trg_validate_production_cycle_references
before insert or update of
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  deleted_at
on public.production_cycles
for each row
execute function
  public.validate_production_cycle_references();

-- ============================================================
-- Coerência das datas
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'production_cycles_initial_forecast_order'
      and conrelid =
        'public.production_cycles'::regclass
  ) then
    alter table public.production_cycles
      add constraint
        production_cycles_initial_forecast_order
      check (
        initial_harvest_forecast is null
        or initial_harvest_forecast >= planting_date
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname =
      'production_cycles_final_harvest_order'
      and conrelid =
        'public.production_cycles'::regclass
  ) then
    alter table public.production_cycles
      add constraint
        production_cycles_final_harvest_order
      check (
        final_harvest_date is null
        or final_harvest_date >= planting_date
      )
      not valid;
  end if;
end
$$;

alter table public.production_cycles
  validate constraint
    production_cycles_initial_forecast_order;

alter table public.production_cycles
  validate constraint
    production_cycles_final_harvest_order;

commit;

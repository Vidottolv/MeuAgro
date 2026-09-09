-- ============================================================
-- MEU AGRO - ETAPA 6
-- Integridade de referências da entidade Area
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- Objetivo:
-- 1. Garantir que property_id pertença ao mesmo usuário da área.
-- 2. Garantir que area_type_id seja um tipo global do sistema
--    ou um tipo personalizado pertencente ao mesmo usuário.
--
-- O RLS continua sendo a camada de autorização.
-- Este trigger adiciona integridade de domínio ao banco.
-- ============================================================

begin;

create or replace function public.validate_area_references()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_property_user uuid;
  v_area_type_user uuid;
  v_area_type_is_system boolean;
begin
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

  if new.area_type_id is not null then
    select
      at.user_id,
      at.is_system
      into
        v_area_type_user,
        v_area_type_is_system
    from public.area_types at
    where at.id = new.area_type_id;

    if not found then
      raise exception
        'Tipo de área inválido.';
    end if;

    if coalesce(
         v_area_type_is_system,
         false
       ) = false
       and (
         v_area_type_user is null
         or v_area_type_user <> new.user_id
       ) then
      raise exception
        'Tipo de área inválido para este usuário.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_area_references
on public.areas;

create trigger
  trg_validate_area_references
before insert or update of
  user_id,
  property_id,
  area_type_id
on public.areas
for each row
execute function
  public.validate_area_references();

commit;

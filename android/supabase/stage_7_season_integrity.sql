-- ============================================================
-- MEU AGRO - ETAPA 7
-- Integridade da entidade Safra (seasons)
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- O RLS já garante que cada usuário só opere suas próprias linhas.
-- Este trigger acrescenta integridade referencial de negócio:
--
-- 1. a propriedade deve estar ativa;
-- 2. a propriedade deve pertencer ao mesmo user_id da safra.
--
-- ============================================================

begin;

create or replace function public.validate_season_references()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_property_user uuid;
begin
  select p.user_id
    into v_property_user
  from public.properties p
  where p.id = new.property_id
    and p.deleted_at is null;

  if v_property_user is null
     or v_property_user <> new.user_id then
    raise exception
      'Propriedade inválida para esta safra.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_season_references
on public.seasons;

create trigger
  trg_validate_season_references
before insert or update of
  user_id,
  property_id
on public.seasons
for each row
execute function
  public.validate_season_references();

commit;

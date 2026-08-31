-- =============================================================================
-- TrainFlow — Migración 0005: rol de usuario en profiles (Fase 1)
--
-- La §7.1 pide "selección de rol al registrarse". La §3 dice que tener AMBOS
-- roles es futuro. Decisión (MVP): un único `role` por perfil, elegido en el
-- registro. Los vínculos coach↔atleta siguen viviendo en
-- coach_athlete_relationships. Para soportar dual-rol más adelante: ALTER a text[].
-- =============================================================================

alter table public.profiles
  add column role text not null default 'athlete'
  check (role in ('coach', 'athlete'));

-- El trigger de creación de perfil ahora también fija el rol desde el metadata
-- del signUp (raw_user_meta_data->>'role'); si falta o es inválido -> 'athlete'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    case
      when new.raw_user_meta_data ->> 'role' in ('coach', 'athlete')
        then new.raw_user_meta_data ->> 'role'
      else 'athlete'
    end
  );
  return new;
end;
$$;

-- El rol es inmutable desde la API (un usuario autenticado no puede cambiarse el
-- rol vía PostgREST). Cambios administrativos vía service_role / SQL sí pasan
-- (auth.uid() es null en ese contexto).
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and (select auth.uid()) is not null then
    raise exception 'profiles.role is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable
  before update on public.profiles
  for each row execute function public.prevent_role_change();

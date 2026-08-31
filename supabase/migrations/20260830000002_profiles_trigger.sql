-- =============================================================================
-- TrainFlow — Migración 0002: Trigger de creación automática de perfil
-- Corresponde a la sección 7.1 del SPEC: "creación automática de `profiles`
-- vía trigger" al registrarse un usuario en Supabase Auth.
--
-- NOTA sobre roles: la sección 7.1 menciona "selección de rol al registrarse",
-- pero la tabla `profiles` (sección 6.2) no define columna `role` y la sección 3
-- indica que los roles son POR RELACIÓN, no globales. En Fase 0 se respeta el
-- esquema del SPEC tal cual. La decisión definitiva del modelo de rol se toma
-- antes de la Fase 1 (ver plan). Aquí solo se copian full_name / avatar_url
-- desde raw_user_meta_data.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

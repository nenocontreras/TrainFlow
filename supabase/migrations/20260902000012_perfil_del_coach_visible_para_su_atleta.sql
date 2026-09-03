-- =============================================================================
-- TrainFlow — Migración 0012: el perfil del coach es visible para su atleta
-- SPEC §6.3. Complementa la 0011 (chat): el atleta necesita leer el `full_name`
-- del coach con el que tiene un hilo. Hasta ahora `profiles_select_self_or_coach`
-- solo dejaba al COACH leer a sus atletas, no al revés.
--
-- Se amplía la política de SELECT de `profiles` para que sea simétrica: cada
-- parte de una relación ACTIVA puede leer el perfil de la otra.
-- =============================================================================

-- ¿El _coach indicado es coach activo del usuario actual (atleta)?
create or replace function public.coach_of_viewer(_coach uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.coach_athlete_relationships r
    where r.coach_id = _coach
      and r.athlete_id = (select auth.uid())
      and r.status = 'active'
  );
$$;

revoke execute on function public.coach_of_viewer(uuid) from public, anon;
grant execute on function public.coach_of_viewer(uuid) to authenticated;

-- Reemplaza la política (drop + recreate, patrón de la migración 0006).
drop policy if exists "profiles_select_self_or_coach" on public.profiles;

create policy "profiles_select_self_or_related"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_coach_of(id)        -- el coach lee a sus atletas
    or public.coach_of_viewer(id)    -- el atleta lee a su coach
  );

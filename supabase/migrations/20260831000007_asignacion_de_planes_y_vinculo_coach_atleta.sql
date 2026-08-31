-- =============================================================================
-- TrainFlow — Migración 0007: Asignación de planes y vínculo coach-atleta
-- Corresponde a las secciones §7.4 (asignación de planes) y §3 (relación
-- coach-atleta) del TrainFlow_SPEC.md.
--
-- 1. `link_athlete_by_email`: un coach vincula a un atleta que ya tiene cuenta
--    escribiendo su email (no hay tabla de invitaciones). Necesita leer
--    auth.users, por eso es SECURITY DEFINER; el insert en
--    coach_athlete_relationships sigue pasando por la policy (coach_id = auth.uid()).
-- 2. Una sola asignación ACTIVA por (plan, atleta).
-- 3. Índice para el cálculo de "qué día del plan toca hoy" (rotación por progreso).
-- 4. Limpieza de grants: los helpers SECURITY DEFINER conservaban EXECUTE vía
--    PUBLIC (el `revoke from anon` de la 0003 no bastó) — advisor de Supabase.
--
-- Las políticas RLS de coach_athlete_relationships, workout_sessions y
-- session_sets ya cubren esta fase (migración 0004): el atleta escribe sus
-- sesiones, el coach las lee. Solo se refuerza plan_assignments para que un
-- coach no pueda asignar un plan a un atleta que no es suyo (ver punto 5).
-- =============================================================================

-- 1. Vincular atleta por email --------------------------------------------------

create or replace function public.link_athlete_by_email(_email text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  _coach uuid := (select auth.uid());
  _athlete_id uuid;
  _athlete public.profiles;
begin
  if not exists (
    select 1 from public.profiles p where p.id = _coach and p.role = 'coach'
  ) then
    raise exception 'Solo un coach puede vincular atletas.' using errcode = 'TF401';
  end if;

  _email := lower(trim(_email));

  select u.id into _athlete_id
  from auth.users u
  where lower(u.email) = _email
  limit 1;

  if _athlete_id is null then
    raise exception 'No hay ninguna cuenta con ese email. Pídele que se registre primero.'
      using errcode = 'TF404';
  end if;

  if _athlete_id = _coach then
    raise exception 'No puedes vincularte a ti mismo.' using errcode = 'TF409';
  end if;

  select p.* into _athlete from public.profiles p where p.id = _athlete_id;

  if _athlete.role is distinct from 'athlete' then
    raise exception 'Esa cuenta no es de un atleta.' using errcode = 'TF422';
  end if;

  insert into public.coach_athlete_relationships (coach_id, athlete_id, status)
  values (_coach, _athlete_id, 'active')
  on conflict (coach_id, athlete_id) do update set status = 'active';

  return _athlete;
end;
$$;

revoke execute on function public.link_athlete_by_email(text) from public, anon;
grant execute on function public.link_athlete_by_email(text) to authenticated;

-- 2. Una asignación activa por (plan, atleta) ----------------------------------

create unique index idx_plan_assignments_active_unique
  on public.plan_assignments (plan_id, athlete_id)
  where active;

-- 3. Índice para "qué día toca hoy" (sesiones de una asignación, por día) ------

create index idx_workout_sessions_assignment_day
  on public.workout_sessions (plan_assignment_id, plan_day_id);

-- 4. Limpieza de grants de los helpers SECURITY DEFINER -----------------------
--    Los helpers booleanos: solo `authenticated` los evalúa (dentro de las
--    policies RLS). Las funciones de trigger no las llama nadie directamente.

revoke execute on function
  public.is_coach_of(uuid),
  public.coach_owns_plan(uuid),
  public.coach_owns_plan_day(uuid),
  public.athlete_can_read_plan(uuid),
  public.athlete_can_read_plan_day(uuid),
  public.athlete_can_read_exercise(uuid),
  public.coach_can_read_assignment(uuid),
  public.athlete_owns_session(uuid),
  public.coach_can_read_session(uuid)
from public, anon;

grant execute on function
  public.is_coach_of(uuid),
  public.coach_owns_plan(uuid),
  public.coach_owns_plan_day(uuid),
  public.athlete_can_read_plan(uuid),
  public.athlete_can_read_plan_day(uuid),
  public.athlete_can_read_exercise(uuid),
  public.coach_can_read_assignment(uuid),
  public.athlete_owns_session(uuid),
  public.coach_can_read_session(uuid)
to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_role_change() from public, anon, authenticated;

-- 5. Refuerzo de plan_assignments -------------------------------------------
--    §6.3 dice "el coach que creó el plan puede escribir". Se añade que el
--    atileta destino sea suyo, para que un coach no pueda empujar su plan a
--    cualquier atleta y ver luego sus sesiones. (Patrón de la migración 0006:
--    drop + recreate, no una segunda policy permisiva.)

drop policy if exists "plan_assignments_insert_coach" on public.plan_assignments;
create policy "plan_assignments_insert_coach"
  on public.plan_assignments for insert to authenticated
  with check (
    public.coach_owns_plan(plan_id)
    and public.is_coach_of(athlete_id)
  );

drop policy if exists "plan_assignments_update_coach" on public.plan_assignments;
create policy "plan_assignments_update_coach"
  on public.plan_assignments for update to authenticated
  using (public.coach_owns_plan(plan_id))
  with check (
    public.coach_owns_plan(plan_id)
    and public.is_coach_of(athlete_id)
  );

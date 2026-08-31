-- =============================================================================
-- TrainFlow — Migración 0008: refuerzo RLS de sesiones + ajustes de asignación
-- SPEC §6.3. Corrige hallazgos del review de RLS de la Fase 3.
--
-- C1 (crítico): `workout_sessions_insert_athlete` solo comprobaba
--   `athlete_id = auth.uid()`. Un atleta podía crear sesiones (y series)
--   colgadas de la asignación de OTRO atleta/coach y contaminar las vistas de
--   adherencia de ese coach. Ahora la sesión debe colgar de una asignación del
--   propio atleta.
-- W4: `session_sets` no ataba `plan_exercise_id` al día de la sesión.
-- W1: el `with check` de update de `plan_assignments` exigía `is_coach_of`, lo
--   que dejaba `unassignPlanAction` bloqueado si el coach ya había quitado al
--   atleta. La titularidad del plan basta para desactivar.
-- W2: `link_athlete_by_email` distinguía "no existe" de "no es atleta"
--   (enumeración de cuentas). Se unifica el mensaje.
-- =============================================================================

-- Helpers -------------------------------------------------------------------

-- ¿La asignación pertenece al atleta actual? (cualquier estado activo)
create or replace function public.athlete_owns_assignment(_assignment uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_assignments a
    where a.id = _assignment
      and a.athlete_id = (select auth.uid())
  );
$$;

-- ¿El plan_exercise pertenece al día de esa sesión?
create or replace function public.plan_exercise_in_session(_session uuid, _plan_exercise uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_sessions ws
    join public.plan_exercises pe on pe.plan_day_id = ws.plan_day_id
    where ws.id = _session
      and pe.id = _plan_exercise
  );
$$;

revoke execute on function
  public.athlete_owns_assignment(uuid),
  public.plan_exercise_in_session(uuid, uuid)
from public, anon;

grant execute on function
  public.athlete_owns_assignment(uuid),
  public.plan_exercise_in_session(uuid, uuid)
to authenticated;

-- C1: workout_sessions -----------------------------------------------------

drop policy if exists "workout_sessions_insert_athlete" on public.workout_sessions;
create policy "workout_sessions_insert_athlete"
  on public.workout_sessions for insert to authenticated
  with check (
    athlete_id = (select auth.uid())
    and public.athlete_owns_assignment(plan_assignment_id)
  );

drop policy if exists "workout_sessions_update_athlete" on public.workout_sessions;
create policy "workout_sessions_update_athlete"
  on public.workout_sessions for update to authenticated
  using (athlete_id = (select auth.uid()))
  with check (
    athlete_id = (select auth.uid())
    and public.athlete_owns_assignment(plan_assignment_id)
  );

-- W4: session_sets -------------------------------------------------------

drop policy if exists "session_sets_insert_athlete" on public.session_sets;
create policy "session_sets_insert_athlete"
  on public.session_sets for insert to authenticated
  with check (
    public.athlete_owns_session(workout_session_id)
    and (
      plan_exercise_id is null
      or public.plan_exercise_in_session(workout_session_id, plan_exercise_id)
    )
  );

drop policy if exists "session_sets_update_athlete" on public.session_sets;
create policy "session_sets_update_athlete"
  on public.session_sets for update to authenticated
  using (public.athlete_owns_session(workout_session_id))
  with check (
    public.athlete_owns_session(workout_session_id)
    and (
      plan_exercise_id is null
      or public.plan_exercise_in_session(workout_session_id, plan_exercise_id)
    )
  );

-- W1: plan_assignments update -------------------------------------------

drop policy if exists "plan_assignments_update_coach" on public.plan_assignments;
create policy "plan_assignments_update_coach"
  on public.plan_assignments for update to authenticated
  using (public.coach_owns_plan(plan_id))
  with check (public.coach_owns_plan(plan_id));

-- W2: link_athlete_by_email — sin oráculo de enumeración -----------------

create or replace function public.link_athlete_by_email(_email text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  _coach uuid := (select auth.uid());
  _athlete public.profiles;
begin
  if not exists (
    select 1 from public.profiles p where p.id = _coach and p.role = 'coach'
  ) then
    raise exception 'Solo un coach puede vincular atletas.' using errcode = 'TF401';
  end if;

  _email := lower(trim(_email));

  select p.* into _athlete
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = _email
    and p.role = 'athlete'
  limit 1;

  -- Un único mensaje para "no existe" y "no es atleta": no revelamos qué cuentas
  -- existen ni su rol.
  if _athlete.id is null then
    raise exception 'No hay ninguna cuenta de atleta con ese email. Pídele que se registre primero.'
      using errcode = 'TF404';
  end if;

  if _athlete.id = _coach then
    raise exception 'No puedes vincularte a ti mismo.' using errcode = 'TF409';
  end if;

  insert into public.coach_athlete_relationships (coach_id, athlete_id, status)
  values (_coach, _athlete.id, 'active')
  on conflict (coach_id, athlete_id) do update set status = 'active';

  return _athlete;
end;
$$;

revoke execute on function public.link_athlete_by_email(text) from public, anon;
grant execute on function public.link_athlete_by_email(text) to authenticated;

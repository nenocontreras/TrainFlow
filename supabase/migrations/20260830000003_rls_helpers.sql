-- =============================================================================
-- TrainFlow — Migración 0003: Funciones helper para RLS
-- Patrón recomendado por Supabase: encapsular los joins de autorización en
-- funciones SECURITY DEFINER estables para (a) evitar recursión de políticas,
-- (b) mantener las políticas legibles. Todas fijan search_path y son STABLE.
-- =============================================================================

-- ¿El usuario actual es coach ACTIVO del atleta indicado?
create or replace function public.is_coach_of(_athlete uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.coach_athlete_relationships r
    where r.coach_id = (select auth.uid())
      and r.athlete_id = _athlete
      and r.status = 'active'
  );
$$;

-- ¿El usuario actual (coach) es dueño del plan indicado?
create or replace function public.coach_owns_plan(_plan uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.training_plans p
    where p.id = _plan
      and p.coach_id = (select auth.uid())
  );
$$;

-- ¿El usuario actual (coach) es dueño del plan al que pertenece este día?
create or replace function public.coach_owns_plan_day(_plan_day uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_days d
    join public.training_plans p on p.id = d.plan_id
    where d.id = _plan_day
      and p.coach_id = (select auth.uid())
  );
$$;

-- ¿El usuario actual (atleta) tiene una asignación ACTIVA sobre este plan?
create or replace function public.athlete_can_read_plan(_plan uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_assignments a
    where a.plan_id = _plan
      and a.athlete_id = (select auth.uid())
      and a.active = true
  );
$$;

-- ¿El usuario actual (atleta) puede leer este día de plan (por asignación activa)?
create or replace function public.athlete_can_read_plan_day(_plan_day uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_days d
    join public.plan_assignments a on a.plan_id = d.plan_id
    where d.id = _plan_day
      and a.athlete_id = (select auth.uid())
      and a.active = true
  );
$$;

-- ¿El usuario actual (atleta) puede leer este ejercicio de biblioteca
-- (porque aparece en un plan que tiene asignado y activo)?
create or replace function public.athlete_can_read_exercise(_exercise uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_exercises pe
    join public.plan_days d on d.id = pe.plan_day_id
    join public.plan_assignments a on a.plan_id = d.plan_id
    where pe.exercise_id = _exercise
      and a.athlete_id = (select auth.uid())
      and a.active = true
  );
$$;

-- ¿El usuario actual (coach) puede leer las sesiones de esta asignación
-- (porque es el coach dueño del plan asignado)?
create or replace function public.coach_can_read_assignment(_assignment uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_assignments a
    join public.training_plans p on p.id = a.plan_id
    where a.id = _assignment
      and p.coach_id = (select auth.uid())
  );
$$;

-- ¿El usuario actual (atleta) es dueño de esta sesión de entrenamiento?
create or replace function public.athlete_owns_session(_session uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_sessions s
    where s.id = _session
      and s.athlete_id = (select auth.uid())
  );
$$;

-- ¿El usuario actual (coach) puede leer esta sesión (por ser coach del plan)?
create or replace function public.coach_can_read_session(_session uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_sessions s
    join public.plan_assignments a on a.id = s.plan_assignment_id
    join public.training_plans p on p.id = a.plan_id
    where s.id = _session
      and p.coach_id = (select auth.uid())
  );
$$;

-- Revocar EXECUTE de anon; solo usuarios autenticados evalúan estos helpers.
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
from anon;

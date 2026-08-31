-- =============================================================================
-- TrainFlow — Migración 0004: Row Level Security (explícito por tabla)
-- Corresponde a la sección 6.3 del SPEC. Se habilita RLS en las 9 tablas y se
-- define una política explícita por operación. Nada implícito ni pospuesto.
--
-- Convención: sin política que la permita, cualquier operación queda denegada.
-- Se usa `to authenticated` en todas las políticas (los usuarios anónimos no
-- tienen acceso a ninguna tabla de negocio).
-- =============================================================================

-- Habilitar + forzar RLS (force => aplica también al dueño de la tabla)
alter table public.profiles                      enable row level security;
alter table public.coach_athlete_relationships   enable row level security;
alter table public.exercise_library              enable row level security;
alter table public.training_plans                enable row level security;
alter table public.plan_days                     enable row level security;
alter table public.plan_exercises                enable row level security;
alter table public.plan_assignments              enable row level security;
alter table public.workout_sessions              enable row level security;
alter table public.session_sets                  enable row level security;

alter table public.profiles                      force row level security;
alter table public.coach_athlete_relationships   force row level security;
alter table public.exercise_library              force row level security;
alter table public.training_plans                force row level security;
alter table public.plan_days                     force row level security;
alter table public.plan_exercises                force row level security;
alter table public.plan_assignments              force row level security;
alter table public.workout_sessions              force row level security;
alter table public.session_sets                  force row level security;

-- -----------------------------------------------------------------------------
-- profiles
--   * cada usuario lee/edita su propio perfil
--   * un coach puede LEER el perfil de sus atletas activos
-- -----------------------------------------------------------------------------
create policy "profiles_select_self_or_coach"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_coach_of(id)
  );

create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- coach_athlete_relationships
--   * ambas partes pueden leer la relación
--   * solo el coach crea / modifica / elimina
-- -----------------------------------------------------------------------------
create policy "car_select_participants"
  on public.coach_athlete_relationships for select to authenticated
  using (
    coach_id = (select auth.uid())
    or athlete_id = (select auth.uid())
  );

create policy "car_insert_coach"
  on public.coach_athlete_relationships for insert to authenticated
  with check (coach_id = (select auth.uid()));

create policy "car_update_coach"
  on public.coach_athlete_relationships for update to authenticated
  using (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));

create policy "car_delete_coach"
  on public.coach_athlete_relationships for delete to authenticated
  using (coach_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- exercise_library
--   * CRUD solo el coach dueño
--   * lectura para el atleta si el ejercicio está en un plan asignado activo
-- -----------------------------------------------------------------------------
create policy "exercise_library_select_owner_or_athlete"
  on public.exercise_library for select to authenticated
  using (
    coach_id = (select auth.uid())
    or public.athlete_can_read_exercise(id)
  );

create policy "exercise_library_insert_owner"
  on public.exercise_library for insert to authenticated
  with check (coach_id = (select auth.uid()));

create policy "exercise_library_update_owner"
  on public.exercise_library for update to authenticated
  using (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));

create policy "exercise_library_delete_owner"
  on public.exercise_library for delete to authenticated
  using (coach_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- training_plans
--   * escritura solo el coach dueño
--   * lectura para el atleta con asignación activa
-- -----------------------------------------------------------------------------
create policy "training_plans_select_owner_or_athlete"
  on public.training_plans for select to authenticated
  using (
    coach_id = (select auth.uid())
    or public.athlete_can_read_plan(id)
  );

create policy "training_plans_insert_owner"
  on public.training_plans for insert to authenticated
  with check (coach_id = (select auth.uid()));

create policy "training_plans_update_owner"
  on public.training_plans for update to authenticated
  using (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));

create policy "training_plans_delete_owner"
  on public.training_plans for delete to authenticated
  using (coach_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- plan_days
--   * escritura solo el coach dueño del plan padre
--   * lectura para el atleta con asignación activa sobre ese plan
-- -----------------------------------------------------------------------------
create policy "plan_days_select_owner_or_athlete"
  on public.plan_days for select to authenticated
  using (
    public.coach_owns_plan(plan_id)
    or public.athlete_can_read_plan(plan_id)
  );

create policy "plan_days_insert_owner"
  on public.plan_days for insert to authenticated
  with check (public.coach_owns_plan(plan_id));

create policy "plan_days_update_owner"
  on public.plan_days for update to authenticated
  using (public.coach_owns_plan(plan_id))
  with check (public.coach_owns_plan(plan_id));

create policy "plan_days_delete_owner"
  on public.plan_days for delete to authenticated
  using (public.coach_owns_plan(plan_id));

-- -----------------------------------------------------------------------------
-- plan_exercises
--   * escritura solo el coach dueño del plan (vía plan_day)
--   * lectura para el atleta con asignación activa
-- -----------------------------------------------------------------------------
create policy "plan_exercises_select_owner_or_athlete"
  on public.plan_exercises for select to authenticated
  using (
    public.coach_owns_plan_day(plan_day_id)
    or public.athlete_can_read_plan_day(plan_day_id)
  );

create policy "plan_exercises_insert_owner"
  on public.plan_exercises for insert to authenticated
  with check (public.coach_owns_plan_day(plan_day_id));

create policy "plan_exercises_update_owner"
  on public.plan_exercises for update to authenticated
  using (public.coach_owns_plan_day(plan_day_id))
  with check (public.coach_owns_plan_day(plan_day_id));

create policy "plan_exercises_delete_owner"
  on public.plan_exercises for delete to authenticated
  using (public.coach_owns_plan_day(plan_day_id));

-- -----------------------------------------------------------------------------
-- plan_assignments
--   * el coach dueño del plan escribe
--   * el coach dueño y el atleta asignado leen
-- -----------------------------------------------------------------------------
create policy "plan_assignments_select_coach_or_athlete"
  on public.plan_assignments for select to authenticated
  using (
    public.coach_owns_plan(plan_id)
    or athlete_id = (select auth.uid())
  );

create policy "plan_assignments_insert_coach"
  on public.plan_assignments for insert to authenticated
  with check (public.coach_owns_plan(plan_id));

create policy "plan_assignments_update_coach"
  on public.plan_assignments for update to authenticated
  using (public.coach_owns_plan(plan_id))
  with check (public.coach_owns_plan(plan_id));

create policy "plan_assignments_delete_coach"
  on public.plan_assignments for delete to authenticated
  using (public.coach_owns_plan(plan_id));

-- -----------------------------------------------------------------------------
-- workout_sessions
--   * el atleta dueño tiene lectura/escritura total
--   * el coach relacionado tiene solo lectura
-- -----------------------------------------------------------------------------
create policy "workout_sessions_select_athlete_or_coach"
  on public.workout_sessions for select to authenticated
  using (
    athlete_id = (select auth.uid())
    or public.coach_can_read_assignment(plan_assignment_id)
  );

create policy "workout_sessions_insert_athlete"
  on public.workout_sessions for insert to authenticated
  with check (athlete_id = (select auth.uid()));

create policy "workout_sessions_update_athlete"
  on public.workout_sessions for update to authenticated
  using (athlete_id = (select auth.uid()))
  with check (athlete_id = (select auth.uid()));

create policy "workout_sessions_delete_athlete"
  on public.workout_sessions for delete to authenticated
  using (athlete_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- session_sets
--   * el atleta dueño de la sesión padre tiene lectura/escritura total
--   * el coach relacionado tiene solo lectura
-- -----------------------------------------------------------------------------
create policy "session_sets_select_athlete_or_coach"
  on public.session_sets for select to authenticated
  using (
    public.athlete_owns_session(workout_session_id)
    or public.coach_can_read_session(workout_session_id)
  );

create policy "session_sets_insert_athlete"
  on public.session_sets for insert to authenticated
  with check (public.athlete_owns_session(workout_session_id));

create policy "session_sets_update_athlete"
  on public.session_sets for update to authenticated
  using (public.athlete_owns_session(workout_session_id))
  with check (public.athlete_owns_session(workout_session_id));

create policy "session_sets_delete_athlete"
  on public.session_sets for delete to authenticated
  using (public.athlete_owns_session(workout_session_id));

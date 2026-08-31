-- =============================================================================
-- TrainFlow — Migración 0006: biblioteca de ejercicios enriquecida + de sistema
--
-- 1. Campos adicionales para clasificar y detallar cada ejercicio.
-- 2. "Ejercicios de sistema": filas con coach_id IS NULL, legibles por cualquier
--    usuario autenticado, no editables (solo el dueño escribe, y nadie es dueño).
--    Se siembran en seed_exercises.sql.
-- =============================================================================

alter table public.exercise_library
  add column movement_pattern text,
  add column equipment text,
  add column tempo text;

-- Índice para filtrar/agrupar la biblioteca.
create index idx_exercise_library_muscle_group on public.exercise_library (muscle_group);
create index idx_exercise_library_equipment on public.exercise_library (equipment);

-- Nombre único entre los ejercicios de sistema (permite upsert en el seed).
create unique index idx_exercise_library_system_name
  on public.exercise_library (name)
  where coach_id is null;

-- Ampliar la política de lectura para incluir los ejercicios de sistema.
drop policy if exists "exercise_library_select_owner_or_athlete" on public.exercise_library;

create policy "exercise_library_select_owner_system_or_athlete"
  on public.exercise_library for select to authenticated
  using (
    coach_id = (select auth.uid())
    or coach_id is null
    or public.athlete_can_read_exercise(id)
  );

-- insert/update/delete siguen exigiendo coach_id = auth.uid(): un coach no puede
-- crear ni modificar ejercicios de sistema (coach_id IS NULL) desde la API.

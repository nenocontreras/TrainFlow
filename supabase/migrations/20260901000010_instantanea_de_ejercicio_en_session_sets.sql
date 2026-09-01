-- =============================================================================
-- TrainFlow — Migración 0010: instantánea del ejercicio en session_sets
-- SPEC §6.2 y §14 (el historial y las gráficas no se rompen al editar planes).
--
-- Hasta ahora una serie solo sabía a qué ejercicio de biblioteca correspondía
-- indirectamente: `session_sets.plan_exercise_id -> plan_exercises.exercise_id`.
-- La migración 0009 puso esa FK en `on delete set null`, así que en cuanto el
-- coach quita un ejercicio de un día del plan, TODAS las series históricas de ese
-- ejercicio pierden el vínculo y desaparecen del panel de progreso — justo lo que
-- 0009 pretendía evitar para el historial.
--
-- Se desnormaliza `exercise_id` en `session_sets`: `startSessionAction` lo escribe
-- al pre-crear las series y las consultas del coach lo leen directamente, sin
-- depender de que `plan_exercises` siga existiendo.
--
-- RLS: no cambia. El acceso a `session_sets` ya lo gobiernan
-- `session_sets_select_athlete_or_coach` / `_insert_athlete` / `_update_athlete`
-- por `workout_session_id`; añadir una columna no abre ninguna ruta nueva. El
-- valor lo pone el servidor; si un atleta lo falsea vía PostgREST solo ensucia su
-- propio progreso (igual que si mintiera en `actual_weight_kg`).
-- =============================================================================

alter table public.session_sets
  add column exercise_id uuid references public.exercise_library (id) on delete set null;

-- Índice de la FK nueva (convención de rendimiento, migración 0001).
create index idx_session_sets_exercise on public.session_sets (exercise_id);

-- Backfill: las series existentes cogen el ejercicio de su plan_exercise vigente.
update public.session_sets s
set exercise_id = pe.exercise_id
from public.plan_exercises pe
where pe.id = s.plan_exercise_id
  and s.exercise_id is null;

-- =============================================================================
-- TrainFlow — Migración 0009: Endurecimiento de historial y sesiones
-- SPEC §6.2 (modelo de datos) y §14 (el historial no se rompe al editar planes).
--
-- 1. `workout_sessions.plan_day_id` y `session_sets.plan_exercise_id` tenían la FK
--    con NO ACTION: borrar un día o un ejercicio de un plan YA entrenado fallaba
--    con error de FK en vez de conservar la sesión histórica con la referencia a
--    NULL. Se recrean con `on delete set null`.
-- 2. No había garantía en BD de "una sesión por día y asignación" — solo lo
--    comprobaba `startSessionAction`. Se añade una columna generada `performed_on`
--    (fecha en UTC, inmutable para poder indexarla) y un índice único sobre
--    `(plan_assignment_id, performed_on)`.
--
-- Nota: tras el `on delete set null` del punto 1, si se borra el día de un plan
-- ya entrenado, `workout_sessions.plan_day_id` queda NULL y el helper
-- `plan_exercise_in_session` (migración 0008) pasa a devolver `false` para esa
-- sesión — el atleta solo podría añadir series sin `plan_exercise_id`. Es
-- aceptable (el día ya no existe) y coherente con SPEC §14.
--
-- No toca RLS: las políticas de `workout_sessions` / `session_sets` no dependen de
-- estas columnas ni de rutas de acceso nuevas.
-- =============================================================================

-- 1. FK del historial -> on delete set null -----------------------------------

alter table public.workout_sessions
  drop constraint workout_sessions_plan_day_id_fkey,
  add constraint workout_sessions_plan_day_id_fkey
    foreign key (plan_day_id) references public.plan_days (id) on delete set null;

alter table public.session_sets
  drop constraint session_sets_plan_exercise_id_fkey,
  add constraint session_sets_plan_exercise_id_fkey
    foreign key (plan_exercise_id) references public.plan_exercises (id) on delete set null;

-- 2. Una sesión por día y asignación -----------------------------------------

-- `performed_at::date` depende de la zona horaria de la sesión y no es inmutable,
-- así que no se puede indexar directamente. Fijamos la fecha en UTC.
alter table public.workout_sessions
  add column performed_on date
    generated always as ((performed_at at time zone 'UTC')::date) stored;

create unique index idx_workout_sessions_one_per_day
  on public.workout_sessions (plan_assignment_id, performed_on);

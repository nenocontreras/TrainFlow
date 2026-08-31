-- =============================================================================
-- TrainFlow — Migración 0001: Esquema inicial
-- Corresponde a la sección 6.2 del TrainFlow_SPEC.md (definición verbatim de las
-- 9 tablas del modelo de datos). Los índices sobre columnas FK son un añadido
-- de rendimiento no estructural documentado en el plan de la Fase 0.
-- =============================================================================

-- Extiende la tabla de auth.users de Supabase con datos de perfil
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Relación coach-atleta (many-to-many, permite roles duales a futuro)
create table public.coach_athlete_relationships (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','ended')),
  created_at timestamptz default now(),
  unique (coach_id, athlete_id)
);

-- Biblioteca de ejercicios reutilizables del coach
create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  muscle_group text,
  instructions text,
  video_url text,
  created_at timestamptz default now()
);

-- Plan de entrenamiento (contenedor general)
create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  duration_weeks int,
  created_at timestamptz default now(),
  archived boolean default false
);

-- Días dentro de un plan (ej. "Día 1 - Empuje")
create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.training_plans(id) on delete cascade,
  day_order int not null,
  label text not null
);

-- Ejercicios asignados a cada día del plan
create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid references public.plan_days(id) on delete cascade,
  exercise_id uuid references public.exercise_library(id),
  exercise_order int not null,
  target_sets int not null,
  target_reps text not null,       -- texto porque puede ser "8-10" o "AMRAP"
  target_rest_seconds int,
  coach_notes text
);

-- Asignación de un plan a un atleta específico
create table public.plan_assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.training_plans(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  start_date date not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Sesión real ejecutada por el atleta (una por día entrenado)
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_assignment_id uuid references public.plan_assignments(id) on delete cascade,
  plan_day_id uuid references public.plan_days(id),
  athlete_id uuid references public.profiles(id) on delete cascade,
  performed_at timestamptz default now(),
  athlete_note text
);

-- Registro de cada serie realizada dentro de una sesión
create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid references public.workout_sessions(id) on delete cascade,
  plan_exercise_id uuid references public.plan_exercises(id),
  set_number int not null,
  actual_reps int,
  actual_weight_kg numeric(6,2),
  completed boolean default false
);

-- -----------------------------------------------------------------------------
-- Índices sobre claves foráneas (rendimiento; no altera el modelo)
-- -----------------------------------------------------------------------------
create index idx_car_coach_id            on public.coach_athlete_relationships (coach_id);
create index idx_car_athlete_id          on public.coach_athlete_relationships (athlete_id);
create index idx_exercise_library_coach  on public.exercise_library (coach_id);
create index idx_training_plans_coach    on public.training_plans (coach_id);
create index idx_plan_days_plan          on public.plan_days (plan_id);
create index idx_plan_exercises_day      on public.plan_exercises (plan_day_id);
create index idx_plan_exercises_exercise on public.plan_exercises (exercise_id);
create index idx_plan_assignments_plan   on public.plan_assignments (plan_id);
create index idx_plan_assignments_athlete on public.plan_assignments (athlete_id);
create index idx_workout_sessions_assignment on public.workout_sessions (plan_assignment_id);
create index idx_workout_sessions_day    on public.workout_sessions (plan_day_id);
create index idx_workout_sessions_athlete on public.workout_sessions (athlete_id);
create index idx_session_sets_session    on public.session_sets (workout_session_id);
create index idx_session_sets_plan_exercise on public.session_sets (plan_exercise_id);

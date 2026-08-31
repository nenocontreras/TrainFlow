-- =============================================================================
-- TrainFlow — Seed de desarrollo (se aplica con `pnpm db:reset`)
-- Crea 2 usuarios de prueba (1 coach, 1 atleta), su relación y un plan mínimo.
-- Solo para entorno LOCAL. Las contraseñas son de juguete.
--
--   coach@trainflow.test   / password123
--   athlete@trainflow.test / password123
-- =============================================================================

-- Usuarios de auth. El trigger `on_auth_user_created` crea los `profiles`.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000c0ac4', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'coach@trainflow.test',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Coach Demo","role":"coach"}', now(), now()),
  ('00000000-0000-0000-0000-00000a1b1e7e', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'athlete@trainflow.test',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Atleta Demo","role":"athlete"}', now(), now());

-- Identidades (necesario para login por email/password en versiones recientes)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000c0ac4',
   '00000000-0000-0000-0000-0000000c0ac4',
   '{"sub":"00000000-0000-0000-0000-0000000c0ac4","email":"coach@trainflow.test"}',
   'email', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-00000a1b1e7e',
   '00000000-0000-0000-0000-00000a1b1e7e',
   '{"sub":"00000000-0000-0000-0000-00000a1b1e7e","email":"athlete@trainflow.test"}',
   'email', now(), now());

-- Relación coach -> atleta
insert into public.coach_athlete_relationships (coach_id, athlete_id, status)
values ('00000000-0000-0000-0000-0000000c0ac4', '00000000-0000-0000-0000-00000a1b1e7e', 'active');

-- Biblioteca de ejercicios del coach
insert into public.exercise_library (id, coach_id, name, muscle_group, instructions)
values
  ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-0000000c0ac4',
   'Press de banca', 'Pecho', 'Escápulas retraídas, barra al esternón.'),
  ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-0000000c0ac4',
   'Sentadilla', 'Pierna', 'Profundidad paralela, rodillas en línea con los pies.');

-- Plan + un día + dos ejercicios
insert into public.training_plans (id, coach_id, name, description, duration_weeks)
values ('22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-0000000c0ac4',
  'Full Body 3x semana', 'Plan base de fuerza general', 8);

insert into public.plan_days (id, plan_id, day_order, label)
values ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 1, 'Día 1 — Full Body A');

insert into public.plan_exercises (plan_day_id, exercise_id, exercise_order, target_sets, target_reps, target_rest_seconds, coach_notes)
values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 1, 4, '8-10', 120, 'RPE 8'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111102', 2, 3, '5', 180, 'Progresión lineal +2.5kg');

-- Asignación al atleta demo
insert into public.plan_assignments (plan_id, athlete_id, start_date, active)
values ('22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-00000a1b1e7e', current_date, true);

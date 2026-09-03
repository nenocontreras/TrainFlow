-- =============================================================================
-- TrainFlow — Migración 0011: mensajes coach ↔ atleta
-- SPEC §7 (módulo nuevo, no estaba en el plan original): chat 1:1 entre un coach
-- y un atleta con relación activa. Diseño en el handoff (coach-chat.tsx).
--
-- Un mensaje pertenece a un "hilo" identificado por (coach_id, athlete_id).
-- Cualquiera de las dos partes de una relación ACTIVA puede leer el hilo y
-- escribir en él; los mensajes son inmutables (sin políticas update/delete).
-- =============================================================================

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  quote text check (quote is null or char_length(quote) <= 500),
  sent_at timestamptz not null default now()
);

-- Índice del hilo (lectura ordenada) + FK de sender (convención de migración 0001).
create index idx_messages_thread on public.messages (coach_id, athlete_id, sent_at);
create index idx_messages_sender on public.messages (sender_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.messages enable row level security;
alter table public.messages force row level security;

-- ¿El usuario actual es una de las dos partes de una relación ACTIVA
-- coach ↔ atleta? Encapsula el join de autorización (patrón de ...3_rls_helpers).
create or replace function public.in_coach_thread(_coach uuid, _athlete uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (select auth.uid()) in (_coach, _athlete)
    and exists (
      select 1
      from public.coach_athlete_relationships r
      where r.coach_id = _coach
        and r.athlete_id = _athlete
        and r.status = 'active'
    );
$$;

revoke execute on function public.in_coach_thread(uuid, uuid) from public, anon;
grant execute on function public.in_coach_thread(uuid, uuid) to authenticated;

-- Lectura: ambas partes del hilo.
create policy "messages_select_thread"
  on public.messages for select to authenticated
  using (public.in_coach_thread(coach_id, athlete_id));

-- Escritura: solo el propio usuario como `sender_id`, y solo dentro de un hilo
-- del que forma parte.
create policy "messages_insert_sender"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select auth.uid()) in (coach_id, athlete_id)
    and public.in_coach_thread(coach_id, athlete_id)
  );

-- Sin update/delete: los mensajes son inmutables (sin política ⇒ denegado).

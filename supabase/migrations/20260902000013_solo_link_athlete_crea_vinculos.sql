-- =============================================================================
-- TrainFlow — Migración 0013: solo `link_athlete_by_email` crea vínculos
-- SPEC §6.3. Cierra un hueco que el chat (0011) y la visibilidad de perfil
-- (0012) convertían en fuga entre inquilinos.
--
-- `car_insert_coach` solo exigía `coach_id = auth.uid()`, SIN comprobar el rol.
-- Cualquier usuario autenticado (incluso un atleta) podía insertarse una fila
-- ACTIVA `{coach_id: yo, athlete_id: víctima}` y con eso:
--   - abrir un hilo de `messages` con la víctima (leer/escribir), y
--   - leer su `profiles` (nombre, avatar, rol) vía `is_coach_of`.
--
-- La app NUNCA inserta en esta tabla desde el cliente: todos los vínculos se
-- crean con `public.link_athlete_by_email` (SECURITY DEFINER, owner `postgres`
-- con BYPASSRLS, y ya valida que el que llama es coach y el destino es atleta).
-- Se elimina la política de INSERT: sin inserciones directas.
-- =============================================================================

drop policy if exists "car_insert_coach" on public.coach_athlete_relationships;

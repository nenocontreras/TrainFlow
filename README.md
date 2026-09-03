# TrainFlow

PWA de coaching de entrenamiento físico. Un **coach** diseña planes y los asigna a
**atletas**, que registran su ejecución serie por serie desde el celular; el coach
supervisa adherencia y progreso desde un panel.

Especificación completa: [`TrainFlow_SPEC.md`](./TrainFlow_SPEC.md).

## Stack

| Capa            | Tecnología                                            |
| --------------- | ----------------------------------------------------- |
| Frontend        | Next.js 15 (App Router) + TypeScript `strict`         |
| UI              | Tailwind CSS v4 + shadcn/ui                           |
| Backend / DB    | Supabase (Postgres + Auth + RLS + Storage)            |
| Estado servidor | TanStack Query                                        |
| Validación      | Zod                                                   |
| Gráficas        | Recharts                                              |
| Testing         | Vitest (unit) + Playwright (e2e)                      |
| CI              | GitHub Actions (lint · type-check · unit+RLS · build) |

> El stack sigue la sección 5.1 del SPEC. Única nota: Tailwind **v4** (config por
> CSS) porque es lo que scaffolda `create-next-app@15` hoy; funcionalmente equivale.

## Requisitos

- Node.js ≥ 22.13 (lo exige `pnpm@11.24`; usa `node:sqlite`)
- pnpm ≥ 11 (`npm i -g pnpm`)
- Un proyecto **Supabase Cloud** (free tier) para desarrollo.
  Docker + Supabase local también sirve si tu máquina tiene RAM de sobra
  (~4-8 GB libres); el CI lo usa. Los scripts `db:*` cubren ambos.

## Puesta en marcha (Supabase Cloud)

```bash
pnpm install

# 1. Credenciales del proyecto (Dashboard > Project Settings > API)
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable / anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<secret / service_role key>

# 2. Enlaza el CLI al proyecto (una vez). Necesita un Personal Access Token:
#    https://supabase.com/dashboard/account/tokens
pnpm supabase login                      # o: export SUPABASE_ACCESS_TOKEN=...
pnpm supabase link --project-ref <ref>

# 3. Aplica las migraciones al proyecto remoto
pnpm db:push

# 4. Genera los tipos TS del esquema
pnpm db:types

# 5. Arranca la app
pnpm dev            # http://localhost:3000
```

> Sin `supabase login` también puedes operar pasando la connection string:
> `pnpm supabase db push --db-url "postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"`
> (y lo mismo para `gen types typescript --db-url ...`).

## Scripts

| Comando                  | Qué hace                                             |
| ------------------------ | ---------------------------------------------------- |
| `pnpm dev`               | Servidor de desarrollo                               |
| `pnpm build` / `start`   | Build de producción / servirlo                       |
| `pnpm lint`              | ESLint                                               |
| `pnpm format`            | Prettier (escribe)                                   |
| `pnpm type-check`        | `tsc --noEmit`                                       |
| `pnpm test:unit`         | Tests unitarios + prueba de aislamiento RLS          |
| `pnpm test:rls`          | Solo la prueba de RLS                                |
| `pnpm test:e2e`          | Playwright (mobile viewport)                         |
| `pnpm db:push`           | Aplica `supabase/migrations/` al proyecto enlazado   |
| `pnpm db:types`          | Regenera `types.ts` desde el proyecto enlazado       |
| `pnpm db:start` / `stop` | Supabase local (opcional, requiere Docker)           |
| `pnpm db:reset`          | Local: recrea la DB con migraciones + `seed.sql`     |
| `pnpm db:types:local`    | Regenera `types.ts` desde Supabase local (lo usa CI) |

## Base de datos

- Migraciones versionadas en [`supabase/migrations/`](./supabase/migrations) — nunca
  editar el esquema a mano desde el Dashboard.
- RLS **habilitado y forzado** en las 9 tablas, con políticas explícitas por
  operación (`supabase/migrations/20260830000004_rls_policies.sql`).
- `tests/unit/rls.test.ts` prueba que un atleta no lee/escribe datos de otro y
  que el coach solo tiene lectura sobre sus atletas. Verificado (8/8) contra el
  proyecto Cloud tras aplicar las migraciones.

## Convenciones

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, …), validado
  por commitlint en `commit-msg`.
- Husky + lint-staged en `pre-commit` (ESLint + Prettier sobre lo staged).
- TypeScript `strict` + `noUncheckedIndexedAccess`; sin `any` sin comentario que lo
  justifique.
- Cada rama = un módulo funcional (sección 7 del SPEC) + su PR + al menos un test de
  la lógica de negocio.

## Autenticación (Fase 1)

- Registro/login con email + password (Supabase Auth). El registro elige rol
  (`athlete` / `coach`); el trigger lo escribe en `profiles.role` (inmutable
  después). Rutas: `/register`, `/login`, `/dashboard` (coach), `/hoy` (atleta).
- `src/middleware.ts` refresca la sesión y protege las rutas de la app.
- Sistema de diseño "Forge" aplicado (`src/app/globals.css`): base cálida,
  acento lima volt, tipografía Archivo + Geist, claro/oscuro por sistema.

> Recomendado en el proyecto Supabase: **Authentication → Email → "Confirm email"
> OFF** (grupo cerrado; el enlace lo compartes tú). Con confirmación ON, el
> registro pide confirmar antes de entrar.

## Coach: ejercicios y planes (Fase 2)

- **Biblioteca de ejercicios** (`/ejercicios`): 50 ejercicios base **de sistema**
  (`coach_id NULL`, solo lectura para todos) clasificados por grupo muscular,
  patrón de movimiento y equipamiento, con vídeo de técnica. Encima, cada coach
  crea sus propios ejercicios (nombre, grupo, patrón, equipamiento, tempo,
  instrucciones, URL de vídeo). Buscador + filtros. No se puede borrar un
  ejercicio usado en algún plan.
- Sembrar/actualizar la biblioteca base: `pnpm db:seed:exercises` (o
  `supabase db query -f supabase/seed_exercises.sql --db-url …`). Es idempotente.
- **Constructor de planes** (`/planes` → `/planes/nuevo` → `/planes/[planId]`):
  crear plan, añadir días, añadir ejercicios por día desde la biblioteca con
  series/reps/descanso/nota. Reordenar (subir/bajar), renombrar, eliminar.
- Archivar plan siempre; **eliminar** solo si no tiene atletas asignados (borrarlo
  haría cascade sobre sesiones ya registradas).
- Lógica de orden en `src/lib/ordering.ts` (helpers puros con test).

## Asignación y entrenamiento (Fase 3)

- **Coach vincula atletas por email** (`/atletas`): el atleta debe tener cuenta;
  la función `link_athlete_by_email` valida rol y crea la relación.
- **Asignar planes** (`/atletas/[id]`): plan + fecha de inicio. "Finalizar"
  desactiva la asignación sin borrar las sesiones. Una asignación activa por
  (plan, atleta).
- **Vista "Hoy"** del atleta (`/hoy`): el día del plan se resuelve por **rotación
  por progreso** (`src/lib/today.ts`) — el siguiente del ciclo según sesiones
  hechas; el atleta puede elegir otro. "Empezar" crea la sesión y sus series;
  registro con feedback optimista (`useOptimistic`). Nota final. Descartar sesión.
  (La UI se rediseñó después — ver "Rediseño de 'Hoy'" más abajo.)
- **Historial** (`/historial`): sesiones pasadas con fecha, día y series completadas.

## Panel del coach y progreso (Fase 4)

- **Panel** (`/dashboard`): sección "Actividad de atletas" — por cada atleta,
  recencia de la última sesión, sesiones en los últimos 7 y 30 días y % de
  series completadas. El modelo "día de hoy" es rotación por progreso (sin
  calendario semanal), así que la adherencia no compara contra un objetivo
  inventado.
- **Ficha del atleta** (`/atletas/[id]`):
  - **Progresión de carga** — selector de ejercicio (sincronizado con `?ej=`) +
    gráfica (Recharts) del **1RM estimado** (Epley: `peso · (1 + reps/30)`) de la
    mejor serie de cada sesión. Necesita ≥ 2 sesiones en días distintos para
    dibujar la línea.
  - **Actividad reciente** — últimas ~12 sesiones con día, series y nota.
- Lógica pura en `src/lib/progress.ts` (`estimatedOneRepMax`, `bestSetOf`,
  `buildLoadSeries`, `adherenceStats`), con test en `tests/unit/progress.test.ts`.
- **Migración 0009**: `workout_sessions.plan_day_id` y
  `session_sets.plan_exercise_id` pasan a `on delete set null` (editar un plan ya
  entrenado ya no rompe el historial); columna generada `performed_on` (fecha
  UTC) + índice único `(plan_assignment_id, performed_on)` → una sesión por día y
  asignación garantizada en BD.
- **Migración 0010**: `session_sets.exercise_id` — instantánea del ejercicio de
  biblioteca al registrar la serie. Así la gráfica de progreso sigue mostrando el
  histórico aunque el coach borre después ese ejercicio del plan (0009 dejaría
  `plan_exercise_id` en null). `startSessionAction` lo escribe al pre-crear las
  series; las consultas del coach lo leen directamente.

## PWA (Fase 5)

- **Service worker** con [Serwist](https://serwist.pages.dev) (`@serwist/next`):
  precache del app-shell y de las rutas estáticas, runtime caching
  (`defaultCache`), y `NetworkOnly` forzado para el origen de Supabase (Auth y
  PostgREST nunca se sirven de caché). Solo activo en producción (`pnpm build` +
  `pnpm start`), desactivado en `pnpm dev`.
- **Offline**: la vista "Hoy" y demás páginas ya visitadas se sirven de caché sin
  conexión (NetworkFirst); una navegación a algo no cacheado cae a
  [`/sin-conexion`](src/app/sin-conexion/page.tsx). Un banner
  (`src/components/offline-banner.tsx`) avisa; el registro de series espera a que
  vuelva la red (sin cola de sincronización — decisión, ver "Pendiente").
- **Instalable**: `src/app/manifest.ts` (íconos 192/512 + maskable, shortcuts,
  `standalone`), `appleWebApp` en el layout, y un botón "Instalar app"
  (`src/components/install-button.tsx`) que usa `beforeinstallprompt`.
- **Íconos**: `pnpm pwa:icons` los regenera a `public/icons/` desde
  `scripts/generate-pwa-icons.mjs` (rayo volt sobre carbón, colores del sistema
  "Forge"). `public/sw.js` se compila en cada build y está git-ignorado.

## Rediseño de "Hoy", chat y métricas (post-MVP)

- **Vista "Hoy" en modo enfoque** (`src/app/(athlete)/hoy/`):
  - `HomeToday` — inicio "sesión primero": la tarjeta del día ocupa el fold.
  - `FocusSession` — sesión en curso a **un ejercicio por pantalla**, cifras
    grandes, una acción primaria, y descanso a pantalla completa
    (`rest-overlay.tsx` + `use-rest-timer.ts`). Reemplaza a la lista `LoggingView`.
- **Métricas de inicio** — `src/lib/home-stats.ts` (puro, test): racha de semanas
  seguidas, volumen de 7 días en toneladas, PRs del bloque (mejor 1RM estimado
  desde el inicio de la asignación activa) y marca de la semana en curso. Todo en
  UTC. `getAthleteHomeStats` en `queries/history.ts` alimenta `HomeToday`.
- **Chat coach ↔ atleta**:
  - Atleta: **`/coach`** — su hilo. Coach: **`/mensajes`** (buzón) y
    **`/mensajes/[athleteId]`** (conversación). `ChatThread` compartido, envío
    con feedback optimista.
  - **Migración 0011**: tabla `messages` con RLS (`in_coach_thread`: ambas partes
    de una relación activa; mensajes inmutables).
  - **Migración 0012**: `profiles` SELECT simétrico (`coach_of_viewer`) — el
    atleta ya puede leer el nombre de su coach.
  - **Migración 0013**: elimina la política de INSERT de
    `coach_athlete_relationships`. Antes, cualquier autenticado podía forjar un
    vínculo (y con el chat, abrir un hilo con una víctima); ahora todos los
    vínculos pasan por `link_athlete_by_email`. (hallazgo del `rls-reviewer`.)
  - El **coach responde desde su buzón**; no hay aún indicador de "no leído" real
    (falta una tabla de lecturas) — la señal es "el último mensaje lo escribió el
    atleta".

## Layout

- **Móvil**: contenedor compacto tipo PWA, top bar mínima y navegación inferior
  táctil.
- **Escritorio (`lg:`)**: sidebar lateral fijo, contenido a ancho de dashboard
  (`max-w-5xl`), y el editor de planes en 2 columnas (catálogo de ejercicios a la
  izquierda, plan en edición a la derecha).
- `src/components/app-shell.tsx` es el marco común de coach y atleta.

## Estado

- **Fase 0** (setup) — completada · `chore/phase-0-setup`.
- **Fase 1** (auth + perfiles + roles) — completada · `feat/phase-1-auth`.
- **Fase 2** (ejercicios + planes) — completada · `feat/phase-2-plans`.
- **Mejoras** (biblioteca base + layout responsive) — `feat/exercise-library-and-responsive`.
- **Fase 3** (asignación + "Hoy" + historial) — `feat/phase-3-assignment-today`.
- **Fase 4** (panel del coach + progreso + gráficas) — `feat/phase-4-coach-dashboard`.
- **Fase 5** (PWA: manifest, service worker, instalable, offline) — `feat/phase-5-pwa`.
- MVP funcionalmente completo. Pendiente: verificación en dispositivo real
  (instalación + Lighthouse ≥ 90) y despliegue.

Roadmap en la sección 13 del SPEC.

## Pendiente de configurar por el mantenedor (fuera del código)

- Crear el repo en GitHub y proteger `main` (requerir PR + checks verdes).
- Conectar el proyecto a Vercel y replicar las env vars en Production.
- Activar el job `e2e` como bloqueante cuando exista el entorno de preview.
- Personal Access Token de Supabase (`supabase login`) para `db:push` / `db:types`
  / `db:seed:exercises` sin pasar la connection string a mano.
- Desactivar "Confirm email" en el proyecto Supabase (ver arriba).
- Activar "Leaked password protection" en Authentication (advisor de Supabase) —
  **requiere plan de pago**; pendiente hasta escalar (ver "Deuda técnica").
- Revisar/sustituir las URLs de vídeo de los 50 ejercicios base (ahora son
  búsquedas de YouTube de la técnica) por enlaces canónicos si se prefiere.
- **Fase 5 / DoD §14**: instalar la PWA en un Android real (Chrome → "Añadir a
  pantalla de inicio") y pasar Lighthouse (`npx lighthouse <url> --view` o
  DevTools → Lighthouse) confirmando PWA + Performance ≥ 90 en el build
  desplegado, no en `localhost`.
- Sustituir el rayo de los íconos por el logo definitivo si se diseña uno
  (`pnpm pwa:icons` tras editar el SVG del script).

## Deuda técnica anotada

- Los helpers `SECURITY DEFINER` siguen siendo ejecutables por `authenticated`
  vía `/rest/v1/rpc/*` (advisor WARN). No hay leak (devuelven booleanos scoped a
  `auth.uid()`), pero moverlos a un esquema `private` sería lo correcto. Es una
  migración que toca **todas** las políticas que los invocan, así que se hará
  aislada, con `pnpm test:rls` antes y después.
- Activar "Leaked password protection" en Supabase Authentication (advisor WARN)
  — bloqueado por el plan free de Supabase; recordatorio para cuando se escale a
  un plan de pago / se profesionalice la app.
- **Offline de escritura**: hoy el registro de series necesita conexión. Una cola
  en IndexedDB que reencole las series marcadas sin señal y las sincronice al
  reconectar (SPEC §9, "evaluar en Fase PWA") queda pendiente — necesita manejo
  de reintentos y conflictos; el uso normal es con conexión.

Resuelto en la Fase 4 (migración 0009): FK del historial con `on delete set null`
e índice único de una sesión por día y asignación.

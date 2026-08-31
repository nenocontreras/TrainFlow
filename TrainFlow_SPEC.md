# TrainFlow — Especificación Técnica del Producto

> **Nota de nomenclatura:** usé "TrainFlow" como nombre provisional del proyecto. Cambia el nombre en este documento y en el prompt si ya tienes uno definido — es un find & replace de una sola palabra.

| Campo | Valor |
|---|---|
| Versión del documento | 1.0 |
| Tipo de producto | PWA (Progressive Web App) de entrenamiento físico |
| Alcance de esta versión | MVP sin agente IA (se deja preparado para Fase 2) |
| Usuarios objetivo | Grupo cerrado (tú como coach + amigos como atletas) |
| Prioridad | Calidad de arquitectura > velocidad de features > cantidad de features |

---

## 1. Visión del producto

TrainFlow es una plataforma donde un **coach** (tú) diseña planes de entrenamiento personalizados y los asigna a **atletas** (tus amigos), quienes los siguen desde su celular, registran su progreso serie por serie, y el coach puede supervisar la evolución de cada uno desde un panel centralizado.

No es un catálogo genérico de rutinas: es una herramienta de **coaching 1-a-1 o 1-a-muchos**, donde la relación coach-atleta es el núcleo del producto.

## 2. Objetivos y no-objetivos

### Objetivos del MVP
- Un coach puede crear planes de entrenamiento estructurados (días, ejercicios, series, repeticiones, descanso, notas técnicas).
- Un coach puede asignar un plan a uno o varios atletas.
- Un atleta puede ver su plan del día, marcar series como completadas, registrar peso/repeticiones reales y dejar comentarios (ej. "hoy me costó la serie 3").
- El coach puede ver el historial y progreso de cada atleta (adherencia, cargas a lo largo del tiempo).
- Funciona como PWA: instalable desde el navegador en Android/iOS, con ícono, splash screen y funcionamiento aceptable con conectividad intermitente.

### Explícitamente fuera de alcance (por ahora)
- Agente de IA conversacional (se deja la arquitectura preparada, pero no se implementa en esta fase).
- Pagos / suscripciones.
- Publicación en App Store / Google Play (se evaluará más adelante empaquetando con Capacitor).
- Videollamadas, mensajería en tiempo real, notificaciones push nativas (push web queda como *nice-to-have* de fase posterior).

## 3. Roles de usuario

| Rol | Descripción | Permisos clave |
|---|---|---|
| `coach` | Tú. Crea y gestiona planes y ejercicios, asigna planes, supervisa progreso. | CRUD sobre planes propios, lectura de progreso de sus atletas asignados. |
| `athlete` | Tus amigos. Reciben planes, registran ejecución. | Lectura de sus planes asignados, escritura sobre sus propios registros de sesión. |

Un mismo usuario podría en el futuro tener ambos roles (ej. un amigo que también entrena a otros), por lo que el modelo de datos debe soportar roles por relación, no por usuario global (ver sección 6).

## 4. Historias de usuario (MVP)

**Como coach:**
- Quiero crear un plan de entrenamiento con múltiples días y ejercicios, para estructurar el trabajo de mis atletas.
- Quiero reutilizar ejercicios de una biblioteca propia (nombre, grupo muscular, instrucciones, video/link opcional) en lugar de escribirlos cada vez.
- Quiero asignar un plan existente a uno o varios atletas con fecha de inicio.
- Quiero ver, por atleta, qué porcentaje del plan ha completado y cómo han evolucionado sus cargas en los ejercicios clave.
- Quiero poder editar un plan ya asignado sin romper el historial de sesiones ya registradas.

**Como atleta:**
- Quiero ver claramente qué me toca entrenar hoy.
- Quiero marcar cada serie como completada e ingresar el peso/repeticiones reales que hice.
- Quiero ver mi historial de entrenamientos pasados.
- Quiero dejar una nota rápida en una sesión (dolor, sensación, dificultad).
- Quiero instalar la app en mi celular como si fuera una app nativa.

## 5. Arquitectura técnica

### 5.1 Stack recomendado

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript** | SSR/SSG para performance, ecosistema maduro, excelente soporte PWA. |
| Estilos / UI | **Tailwind CSS + shadcn/ui** | Velocidad de desarrollo sin sacrificar diseño profesional, totalmente personalizable. |
| Backend / DB | **Supabase** (Postgres + Auth + Row Level Security + Storage) | Backend completo gratis en free tier, seguridad a nivel de fila ideal para un modelo multi-rol, sin servidor propio que mantener. |
| Estado del cliente | **TanStack Query (React Query)** | Cacheo, revalidación y sincronización de datos del servidor. |
| Validación | **Zod** | Validación de esquemas compartida entre formularios y backend. |
| PWA | **next-pwa / Serwist** + Web App Manifest | Instalabilidad, caching offline básico. |
| Gráficas de progreso | **Recharts** | Visualización de evolución de cargas/adherencia. |
| Testing | **Vitest** (unitario) + **Playwright** (e2e) | Estándar actual para proyectos Next.js serios. |
| Hosting | **Vercel** (frontend) + **Supabase Cloud** (backend) | Ambos con free tier suficiente para uso entre amigos. |
| CI/CD | **GitHub Actions** | Lint + test + build en cada PR antes de mergear a `main`. |

### 5.2 Diagrama de arquitectura (alto nivel)

```
┌─────────────────────────────┐
│   Cliente (PWA - navegador) │
│  Next.js App Router + React │
└──────────────┬───────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────┐
│   Next.js Server (Vercel)   │
│  - Server Components        │
│  - Route Handlers (API)     │
│  - Middleware (auth guard)  │
└──────────────┬───────────────┘
               │ Supabase JS Client (SSR + Client)
               ▼
┌─────────────────────────────┐
│         Supabase            │
│  - Postgres (RLS activado)  │
│  - Auth (email/password)    │
│  - Storage (fotos/videos)   │
│  - Realtime (opcional fase2)│
└─────────────────────────────┘
```

### 5.3 Estructura de carpetas propuesta

```
trainflow/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (coach)/
│   │   │   ├── dashboard/
│   │   │   ├── planes/
│   │   │   │   ├── nuevo/
│   │   │   │   └── [planId]/
│   │   │   ├── ejercicios/
│   │   │   └── atletas/[athleteId]/
│   │   ├── (athlete)/
│   │   │   ├── hoy/
│   │   │   ├── historial/
│   │   │   └── plan/[planId]/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── manifest.ts
│   ├── components/
│   │   ├── ui/              # componentes shadcn
│   │   ├── plans/
│   │   ├── sessions/
│   │   └── charts/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts     # tipos generados desde el schema
│   │   ├── validations/     # esquemas Zod
│   │   └── utils.ts
│   ├── hooks/
│   └── types/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── .env.example
└── package.json
```

## 6. Modelo de datos

### 6.1 Diagrama entidad-relación (resumen textual)

```
profiles ──< coach_athlete_relationships >── profiles
   │
   └──< training_plans ──< plan_days ──< plan_exercises >── exercise_library
                │
                └──< plan_assignments >── profiles (athlete)
                          │
                          └──< workout_sessions ──< session_sets
```

### 6.2 Esquema SQL (Postgres / Supabase)

```sql
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
```

### 6.3 Seguridad a nivel de fila (RLS) — reglas clave

- `profiles`: cada usuario solo puede leer/editar su propio perfil; un coach puede leer perfiles de sus atletas activos (join contra `coach_athlete_relationships`).
- `training_plans`, `plan_days`, `plan_exercises`, `exercise_library`: solo el `coach_id` dueño tiene acceso de escritura; un atleta con un `plan_assignments` activo tiene acceso de **solo lectura** al plan asignado.
- `plan_assignments`: el coach que creó el plan puede escribir; el atleta asignado puede leer.
- `workout_sessions`, `session_sets`: el atleta dueño de la sesión tiene lectura/escritura total; el coach relacionado tiene **solo lectura**.

> Instrucción para Claude Code: generar las políticas RLS explícitas para cada tabla como parte de las migraciones, no dejarlas implícitas.

## 7. Especificación funcional por módulo (orden de construcción sugerido)

1. **Auth y perfiles** — registro/login con Supabase Auth (email + password), creación automática de `profiles` vía trigger, selección de rol al registrarse (coach/atleta, pudiendo tener ambos).
2. **Biblioteca de ejercicios (coach)** — CRUD simple.
3. **Constructor de planes (coach)** — crear plan → agregar días → agregar ejercicios por día desde la biblioteca, con sets/reps/descanso.
4. **Asignación de planes (coach)** — seleccionar atleta(s) + fecha de inicio.
5. **Vista "Hoy" (atleta)** — muestra el día de plan correspondiente según fecha de inicio + día de la semana, permite registrar series en tiempo real (similar a apps tipo Hevy/Strong).
6. **Historial (atleta)** — lista de sesiones pasadas con resumen.
7. **Dashboard del coach** — lista de atletas activos, adherencia (% sesiones completadas vs esperadas), gráfica de progresión de carga por ejercicio clave.
8. **PWA** — manifest, íconos, service worker con estrategia *stale-while-revalidate* para assets estáticos, prompt de instalación.

## 8. Principios de diseño UI/UX

- **Mobile-first estricto**: se diseña primero para pantalla de celular (375–430px), el desktop es secundario.
- **Cero fricción durante el entrenamiento**: la pantalla de registro de series debe poder usarse con el pulgar, con botones grandes (mínimo 44x44px táctil), sin necesidad de escribir si no es necesario (usar steppers +/- para peso y reps).
- **Feedback inmediato**: cada serie marcada como completada debe dar confirmación visual instantánea (no esperar respuesta del servidor para actualizar la UI — optimistic updates con React Query).
- **Jerarquía visual clara** entre lo que el atleta debe hacer hoy vs. información histórica.
- **Paleta y tipografía**: definir un sistema de diseño coherente (no colores por defecto de Tailwind sin criterio) — se recomienda pedir a Claude Code una propuesta de paleta antes de codear pantallas, usando la guía de diseño frontend disponible en el entorno.

## 9. Requisitos no funcionales

- **Seguridad**: RLS obligatorio en todas las tablas; nunca exponer `service_role key` en el cliente; variables sensibles solo en `.env.local` y en Vercel env vars.
- **Performance**: Lighthouse score objetivo ≥ 90 en Performance y PWA.
- **Accesibilidad**: componentes con roles ARIA correctos (shadcn/ui ya cumple gran parte de esto), contraste AA mínimo.
- **Offline básico**: la vista "Hoy" debe poder mostrarse desde caché si no hay conexión; los registros se sincronizan al recuperar conexión (cola simple en `localStorage` o IndexedDB — evaluar en Fase PWA).
- **Escalabilidad futura**: el modelo de datos debe soportar sin refactor mayor: múltiples coaches en la misma instancia, y en el futuro, un módulo de agente IA que lea `training_plans` + `workout_sessions` como contexto (dejar esto documentado pero no implementado).

## 10. Convenciones de ingeniería

- TypeScript en modo `strict`, sin `any` salvo justificación explícita en comentario.
- ESLint + Prettier configurados desde el día 1, corriendo en pre-commit (Husky + lint-staged).
- Commits siguiendo **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`).
- Cada módulo funcional (sección 7) se entrega en su propia rama y PR, con al menos una prueba unitaria de la lógica de negocio principal antes de mergear.
- Nombres de tablas y columnas en `snake_case` (convención Postgres); nombres de variables/funciones TypeScript en `camelCase`.
- Tipos de la base de datos generados automáticamente con `supabase gen types typescript`, nunca escritos a mano para evitar desincronización con el schema real.

## 11. Despliegue

- Repositorio en GitHub, rama `main` protegida (requiere PR + checks verdes).
- GitHub Actions: en cada PR corre `lint`, `type-check`, `test:unit`; en cada merge a `main` corre además `test:e2e` contra un entorno de preview de Vercel.
- Variables de entorno replicadas en Vercel (Production) y en `.env.local` (desarrollo), nunca commiteadas.
- Migraciones de Supabase versionadas en `supabase/migrations` y aplicadas vía Supabase CLI, no editadas manualmente desde el dashboard en producción una vez estabilizado el schema.

## 12. Variables de entorno esperadas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # solo en server, nunca expuesto al cliente
```

## 13. Roadmap de fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Setup del repo, Next.js + Supabase + Tailwind + shadcn + CI básico | Pendiente |
| 1 | Auth + perfiles + roles | Pendiente |
| 2 | Biblioteca de ejercicios + constructor de planes | Pendiente |
| 3 | Asignación de planes + vista "Hoy" del atleta | Pendiente |
| 4 | Historial + dashboard del coach + gráficas | Pendiente |
| 5 | PWA (manifest, service worker, instalabilidad, pulido offline) | Pendiente |
| 6 (futuro, fuera de este documento) | Agente IA con contexto del plan y progreso del atleta | Fuera de alcance actual |

## 14. Criterios de aceptación del MVP (Definition of Done)

- [ ] Un coach puede crear un plan completo con al menos 2 días y 3 ejercicios por día.
- [ ] Un coach puede asignar ese plan a un atleta de prueba.
- [ ] El atleta ve correctamente el día que le corresponde según la fecha.
- [ ] El atleta puede registrar todas sus series y el dato persiste en Supabase.
- [ ] El coach ve el historial y una gráfica de progreso de al menos un ejercicio del atleta.
- [ ] La app es instalable como PWA en un celular Android real (verificado, no solo en localhost).
- [ ] RLS probado explícitamente: un atleta no puede leer ni escribir datos de otro atleta ni de planes que no le pertenecen.
- [ ] Lighthouse PWA + Performance ≥ 90 en build de producción.

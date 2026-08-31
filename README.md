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

- Node.js ≥ 20.11
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

## Estado

Fase 0 (setup) completada. Siguiente: Fase 1 — Auth + perfiles + roles.
Roadmap en la sección 13 del SPEC.

## Pendiente de configurar por el mantenedor (fuera del código)

- Crear el repo en GitHub y proteger `main` (requerir PR + checks verdes).
- Conectar el proyecto a Vercel y replicar las env vars en Production.
- Activar el job `e2e` como bloqueante cuando exista el entorno de preview.
- Personal Access Token de Supabase (`supabase login`) para `db:push` / `db:types`
  sin pasar la connection string a mano.

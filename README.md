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
- Docker Desktop en ejecución (para Supabase local)

## Puesta en marcha

```bash
pnpm install

# 1. Levanta Supabase local (Postgres, Auth, Studio...). Requiere Docker.
pnpm db:start

# 2. Aplica migraciones + seed
pnpm db:reset

# 3. Copia las credenciales que imprime `db:start` a tu .env.local
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
#   (si las perdiste: `pnpm supabase status`)

# 4. Genera los tipos TS del esquema
pnpm db:types

# 5. Arranca la app
pnpm dev            # http://localhost:3000
```

## Scripts

| Comando                  | Qué hace                                    |
| ------------------------ | ------------------------------------------- |
| `pnpm dev`               | Servidor de desarrollo                      |
| `pnpm build` / `start`   | Build de producción / servirlo              |
| `pnpm lint`              | ESLint                                      |
| `pnpm format`            | Prettier (escribe)                          |
| `pnpm type-check`        | `tsc --noEmit`                              |
| `pnpm test:unit`         | Tests unitarios + prueba de aislamiento RLS |
| `pnpm test:rls`          | Solo la prueba de RLS                       |
| `pnpm test:e2e`          | Playwright (mobile viewport)                |
| `pnpm db:start` / `stop` | Supabase local                              |
| `pnpm db:reset`          | Recrea la DB: migraciones + `seed.sql`      |
| `pnpm db:types`          | Regenera `src/lib/supabase/types.ts`        |

## Base de datos

- Migraciones versionadas en [`supabase/migrations/`](./supabase/migrations) — nunca
  editar el esquema a mano desde el Dashboard.
- RLS **habilitado y forzado** en las 9 tablas, con políticas explícitas por
  operación (`supabase/migrations/20260830000004_rls_policies.sql`).
- `tests/unit/rls.test.ts` prueba que un atleta no lee/escribe datos de otro y
  que el coach solo tiene lectura sobre sus atletas.

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

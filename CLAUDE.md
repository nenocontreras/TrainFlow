# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TrainFlow is a training-coaching PWA: a **coach** builds training plans (days → exercises)
and assigns them to **athletes**, who log each set from their phone; the coach tracks
adherence and progress. Frontend/DB are Next.js 15 (App Router, TS `strict`) + Supabase
(Postgres + Auth + RLS). UI in Spanish; routes are Spanish words (`/planes`, `/ejercicios`,
`/hoy`, `/dashboard`).

`TrainFlow_SPEC.md` is the authoritative product/data spec. Migrations, tests, and helper
code cite its sections (e.g. "SPEC §6.2"). When a schema or behavior question comes up,
check the SPEC before improvising. `README.md` tracks phase status: Fases 0–2 (setup, auth,
exercises+plans) are done; Fase 3 (plan assignment + athlete "Hoy" view) is next. Work
proceeds one functional module per branch + PR + a business-logic test.

## Commands

Package manager is **pnpm** (`pnpm@11`, Node ≥20.11). Common:

| Task                               | Command                                        |
| ---------------------------------- | ---------------------------------------------- |
| Dev server                         | `pnpm dev` (http://localhost:3000)             |
| Lint / fix                         | `pnpm lint` · `pnpm lint:fix`                  |
| Format check / write               | `pnpm format:check` · `pnpm format`            |
| Type-check                         | `pnpm type-check`                              |
| Unit tests (incl. RLS isolation)   | `pnpm test:unit`                               |
| Single unit test file              | `pnpm vitest run tests/unit/ordering.test.ts`  |
| Single test by name                | `pnpm vitest run -t "<describe/it substring>"` |
| Watch a test                       | `pnpm test:unit:watch`                         |
| RLS isolation test only            | `pnpm test:rls`                                |
| E2E (Playwright, Pixel-7 viewport) | `pnpm build` then `pnpm test:e2e`              |
| Coverage                           | `pnpm test:coverage`                           |

The CI job (`.github/workflows/ci.yml`) runs, in order: Prettier check → ESLint →
type-check → `pnpm test:unit` → `pnpm build`, all against a **local Supabase** it spins up.
E2E runs only on `main`. Run `pnpm format` + `pnpm lint` + `pnpm type-check` before
committing — `husky` `pre-commit` runs `lint-staged` (eslint --fix + prettier on staged),
`commit-msg` runs `commitlint`.

### Database

Migrations live in `supabase/migrations/` (timestamp-prefixed, `YYYYMMDDHHMMSS_name.sql`).
**Never edit the schema by hand in the Supabase Dashboard, and never edit an
already-applied migration** — add a new one. After any schema change, regenerate types:
`pnpm db:types` (linked cloud project) or `pnpm db:types:local` (local, what CI uses) →
writes `src/lib/supabase/types.ts` (git-tracked, ESLint-ignored).

- Cloud dev: `pnpm supabase link --project-ref <ref>`, then `pnpm db:push`.
- Local dev (needs Docker + ~4–8 GB free RAM): `pnpm db:start`, `pnpm db:reset`
  (recreates DB from migrations + `supabase/seed.sql`), `pnpm db:stop`.

## Architecture

### The security boundary is RLS, not app code

Every table has RLS **enabled and forced** with explicit per-operation policies
(`supabase/migrations/...4_rls_policies.sql`). Authorization joins are encapsulated in
`SECURITY DEFINER STABLE` SQL helper functions (`...3_rls_helpers.sql`: `is_coach_of`,
`coach_owns_plan`, `athlete_can_read_plan`, `coach_can_read_session`, …) so policies stay
readable and non-recursive. `tests/unit/rls.test.ts` asserts the MVP acceptance criterion:
an athlete cannot read/write another athlete's or an unassigned plan's data, and a coach
has read-only access to their athletes. Treat that test as a spec — if you touch schema,
policies, or helpers, run `pnpm test:rls` and extend it.

There are **three** Supabase clients, and choosing the wrong one is a security bug:

| File                                              | Used from                                         | RLS                                                |
| ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| `src/lib/supabase/server.ts` (`createClient`)     | Server Components, Route Handlers, Server Actions | **respects** RLS (anon key + user session cookies) |
| `src/lib/supabase/client.ts` (`createClient`)     | `"use client"` components                         | **respects** RLS                                   |
| `src/lib/supabase/admin.ts` (`createAdminClient`) | server-only admin tasks, seeds, integration tests | **BYPASSES** RLS (service_role)                    |

`admin.ts` and `server.ts` are `import "server-only"`. Never import `admin.ts` from code
reachable by the client. `src/lib/supabase/middleware.ts` implements the official
`@supabase/ssr` session-refresh pattern and is only called by `src/middleware.ts`.

### Auth & roles

Registration picks a role (`coach` | `athlete`); the `handle_new_user` trigger writes it to
`profiles.role` from `raw_user_meta_data`. `role` is **immutable via the API** — a
`prevent_role_change` trigger blocks any authenticated update; only `service_role`/SQL can
change it. App-side auth gates live in `src/lib/auth.ts`: `getSessionUser()`,
`requireUser()` (→ `/login`), `requireRole(role)` (→ role's landing page).
`landingPathFor`: coach → `/dashboard`, athlete → `/hoy`.

`src/middleware.ts` redirects unauthenticated users away from protected prefixes
(`/dashboard`, `/planes`, `/ejercicios`, `/atletas`, `/hoy`, `/historial`, `/plan`) and
authenticated users away from `/login`·`/register`. Route groups mirror this:
`src/app/(auth)`, `src/app/(coach)`, `src/app/(athlete)`.

### Mutations: Server Actions

All writes are Server Actions in `src/lib/actions/{auth,exercises,plans}.ts` (`"use server"`).
The consistent shape:

1. `await requireRole("coach")` (or `requireUser()`) first — every action re-checks auth.
2. Parse `FormData` with a Zod schema from `src/lib/validations/`; on failure return
   `{ fieldErrors: z.flattenError(parsed.error).fieldErrors }`.
3. `createClient()` from `server.ts`, do the mutation (RLS is the real guard).
4. On DB error return `{ error: "mensaje en español" }`; on success `{ ok: true }` or
   `redirect(...)`, plus `revalidatePath(...)`.

Return type is `ActionState` (exported from `actions/exercises.ts`), designed for React
`useActionState`. Reads for Server Components live in `src/lib/queries/` (also `server-only`),
returning nested/shaped types (`getPlanDetail` → plan → days → exercises, sorted).

### Positional ordering

Plan days and a day's exercises are ordered by contiguous integers `1..N`. All ordering
logic is pure functions in `src/lib/ordering.ts` (`nextOrder`, `move`, `renumber`), unit
tested. Actions load the current order, apply the helper, and write back every changed row
(and renumber after deletes). Keep this logic in `ordering.ts`, not inline in actions.

### Other

- **Env vars** are validated at startup by `src/lib/env.ts` (Zod, fail-fast). Import `env`
  from there; read the service-role key only via `getServiceRoleKey()`.
- **Client state**: TanStack Query, provider in `src/app/providers.tsx` (staleTime 30s, no
  refetch on focus). Toasts via `sonner` (`<Toaster position="top-center" />`).
- **UI**: shadcn/ui in `src/components/ui/` (add with `pnpm dlx shadcn@latest add ...`),
  Tailwind **v4** (CSS-config, no `tailwind.config`). Design system "Forge" lives in
  `src/app/globals.css` (lime-volt accent, Archivo + Geist, system light/dark).
- **PWA**: manifest is `src/app/manifest.ts`.

## Conventions

- **Conventional Commits in Spanish**, scoped: `feat(coach): ...`, `test(auth): ...`,
  `chore(e2e): ...`. Enforced by commitlint.
- TypeScript `strict` + `noUncheckedIndexedAccess`. `@typescript-eslint/no-explicit-any`
  is an **error** — if genuinely needed, `eslint-disable` with a comment explaining why.
- `consistent-type-imports` (inline `import { type X }`), `eqeqeq` smart, `no-console`
  warns (allows `warn`/`error`; off in tests).
- Vitest runs single-fork / no parallelism on purpose (low-RAM machines). Default env is
  `node`; component tests opt in with `// @vitest-environment jsdom` at the top of the file.
- DB column names are `snake_case`; app/Zod fields are `camelCase` — actions map between
  them explicitly (`toRow` helpers).

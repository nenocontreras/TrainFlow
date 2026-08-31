---
name: create-migration
description: >
  Create a new Supabase migration for TrainFlow with the repo's naming, house
  SQL style, and Row Level Security checklist, then run the follow-up steps
  (regenerate DB types, extend the RLS test). Use when adding or changing the
  database schema — a table, column, index, trigger, function, or RLS policy.
disable-model-invocation: true
---

# create-migration

Guided workflow for schema changes in TrainFlow. Migrations are the **only** way
the schema changes — never edit it by hand in the Supabase Dashboard, and never
edit a migration that has already been applied (`db:push` / `db:reset` / CI). Add
a new one.

## 1. Scaffold the file

```bash
bash .claude/skills/create-migration/scripts/new-migration.sh "<short description>"
```

This creates `supabase/migrations/<YYYYMMDD><NNNNNN>_<slug>.sql` where `NNNNNN` is
the next global 6-digit sequence (0001, 0002, …), matching the existing files. It
prints the path and refuses to overwrite. Open that file and write the DDL.

## 2. House SQL style

Match the existing migrations exactly:

- A header comment block: `-- TrainFlow — Migración NNNN: <Título>` + the relevant
  `TrainFlow_SPEC.md` section, then a sentence on what it does and why.
- Lowercase SQL keywords. `snake_case` identifiers. Schema-qualify everything
  (`public.training_plans`, not `training_plans`).
- FK columns get an index (`create index idx_<table>_<col> on public.<table> (<col>);`)
  — perf convention from migration 0001.
- App code uses `camelCase`; the DB stays `snake_case`. Server Actions map between
  them explicitly (`toRow` helpers) — don't add camelCase columns to "save a step".

## 3. RLS checklist — do not skip

RLS is TrainFlow's real authorization boundary (SPEC §6.3). Any authenticated user
can call PostgREST directly with their JWT, so the database must deny cross-tenant
access on its own. See `references/rls-checklist.md` for the full rules and
copy-paste templates. The essentials:

- **New table**: `enable row level security;` **and** `force row level security;`,
  then **one explicit policy per operation** (`select`, `insert`, `update`,
  `delete`), every one `to authenticated`. No policy ⇒ denied — that's intended,
  but a table you forgot to write `insert`/`update` for is a bug, not a feature.
- `insert` → `with check`. `update` → both `using` and `with check`. Ownership
  columns (`coach_id`, `athlete_id`) pinned to `(select auth.uid())` in
  `with check`.
- Authorization joins go in a `security definer`, `stable`,
  `set search_path = ''` SQL helper (style of `..._rls_helpers.sql`), with
  `revoke execute on function public.<fn>(...) from anon;`.
- Adding a column/FK that creates a **new way to reach** a plan/day/session? Update
  the affected policies: `drop policy if exists "<name>" on public.<table>;` then
  recreate (pattern in migration 0006).
- Never weaken an existing policy: don't drop `force`, widen a `using` predicate,
  add `to public` / `to anon`, or expose a mutable function.

## 4. Apply it

- **Local** (Docker): `pnpm db:reset` — recreates the DB from all migrations +
  `supabase/seed.sql`. Watch for errors.
- **Cloud** (linked project): `pnpm db:push`.

## 5. Regenerate DB types (always)

```bash
pnpm db:types:local     # from local Supabase (what CI uses)
# or: pnpm db:types      # from the linked cloud project
```

This rewrites `src/lib/supabase/types.ts` (git-tracked, ESLint-ignored). Commit it
in the same change. Then `pnpm type-check` — new/renamed columns often surface as
type errors in `src/lib/queries/` and `src/lib/actions/`.

## 6. Extend the RLS test

If the migration touched a table, policy, or helper, add cases to
`tests/unit/rls.test.ts` — at minimum one **allowed** and one **denied** case
(another athlete, or a non-owning coach). Then:

```bash
pnpm test:rls
```

Report the result honestly — it **skips** silently if Supabase env vars aren't
set; that is not a pass.

## 7. Review & commit

- Run the `rls-reviewer` subagent on the diff before committing anything that
  touches the data layer.
- Commit with a Spanish Conventional Commit, `db` scope:
  `feat(db): asignación de planes + RLS` / `fix(db): ...` / `chore(db): ...`.

## Reference

- `references/rls-checklist.md` — full RLS rules, the intended coach/athlete
  access matrix, and policy + helper templates.

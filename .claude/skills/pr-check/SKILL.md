---
name: pr-check
description: >
  Run TrainFlow's CI gate locally before opening a PR — Prettier check, ESLint,
  type-check, unit tests (incl. RLS) — in the same order as .github/workflows/ci.yml,
  then summarize failures and remind about the per-module business-logic test and
  data-layer reviewers. Use before pushing a branch or opening a PR.
disable-model-invocation: true
---

# pr-check

TrainFlow ships one functional module per branch + PR + a business-logic test.
CI (`.github/workflows/ci.yml`) runs, in order: Prettier check -> ESLint ->
type-check -> `pnpm test:unit` -> `pnpm build`. Run that gate locally first so CI
comes back green.

## 1. Run the gate (stop at the first failure)

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:unit
```

- If `format:check` fails: `pnpm format`, re-stage, continue.
- If `lint` fails: `pnpm lint:fix` for the mechanical ones; fix the rest by hand
  (`no-explicit-any` is an error — only silence it with a comment saying why).
- `test:unit` includes `tests/unit/rls.test.ts`. It **skips silently** without
  Supabase env vars — a skip is not a pass. Say which ran.

`pnpm build` is the last CI step; run it if the change touches config, routing,
`next.config`, or server/client boundaries. On the low-RAM dev box it's heavy —
skipping it locally is fine if the diff is UI/logic only, note that you did.

## 2. Change-specific checks

- **Data layer** (`supabase/migrations/`, `src/lib/actions/`, `src/lib/queries/`,
  `src/lib/supabase/`): run `pnpm test:rls` and the `rls-reviewer` subagent; for
  actions/queries also `server-action-reviewer`. Migrations: confirm
  `src/lib/supabase/types.ts` was regenerated and committed.
- **UI** (`src/components/`, `src/app/**/*.tsx`): run the `ui-a11y-reviewer`
  subagent; if `pnpm build` is done, `pnpm test:e2e` (Pixel-7).
- **New module**: confirm there's a business-logic test for it (the PR
  convention). Pure logic belongs in a helper (`src/lib/ordering.ts` style),
  not inline in an action.

## 3. Commit & PR

- Staged changes clean under `pnpm format` + `pnpm lint` (husky `pre-commit`
  runs `lint-staged`; `commit-msg` runs `commitlint`).
- Spanish Conventional Commit, scoped: `feat(coach): …`, `test(auth): …`.
- PR description: what module, which SPEC section, how it was tested.

## 4. Report

Print a short table: step -> pass / fail / skipped, with the failing output
quoted verbatim. Do not claim green if anything was skipped — name it.

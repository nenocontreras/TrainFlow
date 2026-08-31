---
name: new-server-action
description: >
  Scaffold a new TrainFlow Server Action (plus its Zod schema and toRow mapper)
  following the repo's fixed shape: requireRole/requireUser first, FormData parsed
  with a Zod schema from src/lib/validations/, createClient() from server.ts, the
  ActionState return, explicit camelCase<->snake_case mapping, and revalidatePath.
  Use when adding a mutation under src/lib/actions/.
disable-model-invocation: true
---

# new-server-action

Every write in TrainFlow is a Server Action with the **same shape** (CLAUDE.md
"Mutations: Server Actions"). This skill produces one that matches
`src/lib/actions/exercises.ts` exactly. RLS is still the real guard — this is the
app-side contract on top of it.

## 1. Gather the specifics

Ask the user (or infer from the request):

- **Domain / file** — `auth`, `exercises`, `plans`, or a new
  `src/lib/actions/<domain>.ts`.
- **Operation(s)** — create / update / delete (usually one action each).
- **Role gate** — `requireRole("coach")` for coach data, `requireUser()` for
  athlete-owned data. Coaches never write athletes' sessions.
- **Table** and its columns (check `src/lib/supabase/types.ts` for the real
  `snake_case` names — do not guess).
- **Routes to revalidate** — the Spanish routes that render this data
  (`/ejercicios`, `/planes`, `/plan/[id]`, `/hoy`, …).

## 2. Zod schema — `src/lib/validations/<domain>.ts`

`camelCase` fields, Spanish `.min`/`.max` messages, `export type XInput =
z.infer<typeof xSchema>`. Optional text columns: `.trim().optional()` or
`.nullish()`. Mirror `src/lib/validations/exercise.ts`.

## 3. The action file

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth"; // or requireUser
import { xSchema, type XInput } from "@/lib/validations/x";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function parseX(formData: FormData) {
  return xSchema.safeParse({
    // field: formData.get("field"), …
  });
}

function toRow(data: XInput) {
  return {
    // snake_column: data.camelField ?? null, …
  };
}

export async function createXAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { id: ownerId } = await requireRole("coach"); // auth FIRST, always
  const parsed = parseX(formData);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("<table>")
    .insert({ owner_col: ownerId, ...toRow(parsed.data) });
  if (error) return { error: "No se pudo guardar…" }; // Spanish, never the raw error

  revalidatePath("/<route>");
  return { ok: true };
}
```

Rules that are **not** optional:

1. `requireRole(...)` / `requireUser()` is the **first** statement.
2. IDs from `FormData` are validated (`z.guid().safeParse(formData.get("id"))`),
   never used raw.
3. `createClient()` from `@/lib/supabase/server` — **never** `createAdminClient`.
4. On DB error: return `{ error: "<mensaje en español>" }`. On success:
   `{ ok: true }` or `redirect(...)`.
5. `revalidatePath(...)` every affected route.
6. Explicit `toRow` mapping — no `camelCase` columns, no spreading raw parsed
   data beyond the pinned ownership column.

## 4. Wire the form

Client component uses `useActionState(createXAction, {})`; show
`state.fieldErrors?.<field>` via `field-error.tsx`, `state.error` via a toast
(`sonner`) or `auth-message.tsx`.

## 5. Verify

```bash
pnpm lint && pnpm type-check
pnpm vitest run -t "<action name>"   # add a business-logic test for the module
```

If the action touches a table whose policies are new or changed, also run
`pnpm test:rls` and the `rls-reviewer` subagent. Then run
`server-action-reviewer` on the diff.

## 6. Commit

Spanish Conventional Commit, scoped: `feat(coach): acción para <cosa>`.

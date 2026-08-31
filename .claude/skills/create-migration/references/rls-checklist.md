# RLS checklist & templates (TrainFlow)

RLS is the authorization boundary. `requireRole()` in Server Actions is
defense-in-depth only. Assume an authenticated user hits PostgREST directly with
their own JWT — the database must deny cross-tenant access unaided.

Source of truth: `supabase/migrations/*_rls_helpers.sql` (helpers),
`*_rls_policies.sql` (the 9-table policy set), migration 0006 (how to amend a
policy), `TrainFlow_SPEC.md` §6.3.

## Intended access matrix

| Table                         | Coach                                                                  | Athlete                                                          |
| ----------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `profiles`                    | R/W own; **read-only** on active athletes                              | R/W own                                                          |
| `coach_athlete_relationships` | R/W where `coach_id = me`                                              | read where `athlete_id = me`                                     |
| `exercise_library`            | full CRUD where `coach_id = me`; read system rows (`coach_id is null`) | read if exercise is in an active assigned plan; read system rows |
| `training_plans`              | full CRUD where `coach_id = me`                                        | read via `active` `plan_assignments`                             |
| `plan_days`                   | full CRUD if coach owns parent plan                                    | read via active assignment on the plan                           |
| `plan_exercises`              | full CRUD if coach owns plan (via `plan_day`)                          | read via active assignment                                       |
| `plan_assignments`            | full CRUD if coach owns the plan                                       | read where `athlete_id = me`                                     |
| `workout_sessions`            | **read-only** if coach of the assignment                               | full CRUD where `athlete_id = me`                                |
| `session_sets`                | **read-only** if coach of the parent session                           | full CRUD if athlete owns parent session                         |

- `profiles.role` is immutable via the API (trigger `prevent_role_change`); only
  `service_role`/SQL changes it.
- "System" exercises: `exercise_library` rows with `coach_id is null` — readable by
  any authenticated user, writable by nobody through the API (insert/update/delete
  policies still require `coach_id = (select auth.uid())`).
- `createAdminClient()` (`src/lib/supabase/admin.ts`, service_role) bypasses all of
  this — only seeds, jobs, and integration tests may use it.

## New-table checklist

- [ ] `alter table public.<t> enable row level security;`
- [ ] `alter table public.<t> force row level security;`
- [ ] `select` policy, `to authenticated`
- [ ] `insert` policy, `to authenticated`, `with check`
- [ ] `update` policy, `to authenticated`, `using` **and** `with check`
- [ ] `delete` policy, `to authenticated`, `using`
- [ ] ownership column pinned to `(select auth.uid())` in `with check`
- [ ] any authorization join extracted to a `security definer` helper (below)
- [ ] index on every FK column

## Policy template

```sql
alter table public.<table> enable row level security;
alter table public.<table> force row level security;

create policy "<table>_select_<who>"
  on public.<table> for select to authenticated
  using ( <predicate> );

create policy "<table>_insert_<who>"
  on public.<table> for insert to authenticated
  with check ( <owner_col> = (select auth.uid()) /* or helper(...) */ );

create policy "<table>_update_<who>"
  on public.<table> for update to authenticated
  using ( <predicate> )
  with check ( <predicate> );

create policy "<table>_delete_<who>"
  on public.<table> for delete to authenticated
  using ( <predicate> );
```

Use the `(select auth.uid())` form (not bare `auth.uid()`) — it's the init-plan
optimization the whole policy set uses.

## Helper-function template

```sql
create or replace function public.<name>(_arg uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.<table> t
    -- joins, all public.-qualified
    where t.<...> = _arg
      and t.<owner> = (select auth.uid())
      and t.<status/active flag as required>
  );
$$;

revoke execute on function public.<name>(uuid) from anon;
```

Requirements: `security definer`, `stable`, `set search_path = ''`, every table
`public.`-qualified, `execute` revoked from `anon`. Never `volatile`.

## Amending a policy (new access path)

When a new column/FK lets a user reach an existing table a new way, don't add a
second permissive policy — replace the one that exists (migration 0006 pattern):

```sql
drop policy if exists "<table>_select_<who>" on public.<table>;

create policy "<table>_select_<who>_v2"
  on public.<table> for select to authenticated
  using ( <old predicate> or <new predicate> );
```

## Anti-patterns (findings)

- Table with RLS enabled but missing an `insert` or `update` policy that the app
  needs → writes silently fail, or someone "fixes" it with a too-broad policy.
- `enable` without `force`.
- `using` on an `update`/`insert` without `with check` (lets a row be rewritten to
  another owner).
- Relying on a Server Action's `.eq("coach_id", me)` filter instead of a policy.
- New helper missing `set search_path = ''` or still executable by `anon`.
- Editing an already-applied migration instead of adding a new one.

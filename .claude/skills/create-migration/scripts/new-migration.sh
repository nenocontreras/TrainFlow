#!/usr/bin/env bash
# TrainFlow — scaffold a new Supabase migration file following the repo convention.
#
# Naming: <YYYYMMDD><NNNNNN>_<slug>.sql
#   YYYYMMDD  = today (UTC-local, `date +%Y%m%d`)
#   NNNNNN    = global 6-digit sequence = (highest existing sequence) + 1
#   slug      = snake_case, from the arguments
#
# Usage:  bash .claude/skills/create-migration/scripts/new-migration.sh "plan assignments and RLS"
# Prints the path of the created file on stdout. Refuses to overwrite.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
mig_dir="$repo_root/supabase/migrations"
[ -d "$mig_dir" ] || { echo "error: $mig_dir not found — run from the TrainFlow repo" >&2; exit 1; }

if [ "$#" -eq 0 ]; then
  echo "error: give the migration a name, e.g.  new-migration.sh \"plan assignments\"" >&2
  exit 1
fi

# --- slug ---------------------------------------------------------------------
raw="$*"
slug="$(printf '%s' "$raw" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//; s/_+/_/g')"
[ -n "$slug" ] || { echo "error: name produced an empty slug" >&2; exit 1; }

# --- sequence ----------------------------------------------------------------
# Highest trailing 6-digit block across existing migrations, default 0.
last_seq="$(
  ls "$mig_dir" 2>/dev/null \
    | sed -nE 's/^[0-9]{8}([0-9]{6})_.*\.sql$/\1/p' \
    | sort -n | tail -1
)"
last_seq="${last_seq:-000000}"
next_seq="$(printf '%06d' "$((10#$last_seq + 1))")"

prefix="$(date +%Y%m%d)${next_seq}"
file="$mig_dir/${prefix}_${slug}.sql"
[ -e "$file" ] && { echo "error: $file already exists" >&2; exit 1; }

human_seq="$((10#$next_seq))"
title="$(printf '%s' "$raw" | sed -E 's/(^| )([a-z])/\1\u\2/g')"

cat > "$file" <<EOF
-- =============================================================================
-- TrainFlow — Migración $(printf '%04d' "$human_seq"): ${title}
-- Corresponde a la sección <§ del SPEC> del TrainFlow_SPEC.md.
--
-- <Qué hace y por qué. Si toca RLS, describe el acceso que habilita/deniega.>
-- =============================================================================

-- <DDL aquí. SQL en minúsculas, columnas snake_case, tablas public.-cualificadas.>

-- -----------------------------------------------------------------------------
-- RLS  (borra este bloque si la migración no toca tablas ni rutas de acceso)
--
--  [ ] tabla nueva     -> enable row level security;  force row level security;
--  [ ] una policy explícita por operación (select / insert / update / delete),
--      todas  to authenticated
--  [ ] insert -> with check ;  update -> using + with check
--  [ ] coach_id / athlete_id fijados a (select auth.uid()) en with check
--  [ ] joins de autorización -> helper security definer / stable /
--      set search_path = '' ;  revoke execute ... from anon;
--  [ ] ¿nueva ruta de acceso a un plan/día/sesión? -> drop policy if exists +
--      recrear las policies afectadas (ver migración 0006)
--  [ ] índice en columnas FK nuevas
-- -----------------------------------------------------------------------------
EOF

printf '%s\n' "$file"

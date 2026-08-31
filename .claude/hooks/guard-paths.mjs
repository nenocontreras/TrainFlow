#!/usr/bin/env node
// TrainFlow — PreToolUse guard for Edit|Write.
// Blocks edits that CLAUDE.md forbids:
//   - any .env* file (secrets)
//   - src/lib/supabase/types.ts (generated — regenerate with `pnpm db:types`)
//   - an already-applied migration (a git-tracked file under supabase/migrations/)
// Exit 2 + stderr => Claude Code blocks the tool call and shows the message.

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const input = payload.tool_input ?? {};
const fp = input.file_path ?? input.path ?? "";
if (!fp) process.exit(0);
const norm = String(fp).replace(/\\/g, "/");

function block(msg) {
  process.stderr.write(msg + "\n");
  process.exit(2);
}

function isTracked(file) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", file], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (/(^|\/)\.env(\.[^/]*)?$/.test(norm) && !/\.env\.example$/.test(norm)) {
  block(
    "Bloqueado: los archivos .env contienen secretos y no se editan desde Claude. " +
      "Pide al usuario que haga el cambio a mano.",
  );
}

if (norm.endsWith("src/lib/supabase/types.ts")) {
  block(
    "Bloqueado: src/lib/supabase/types.ts es generado. Tras aplicar una migración " +
      "regénralo con `pnpm db:types` (o `pnpm db:types:local`); no lo edites a mano.",
  );
}

if (/supabase\/migrations\/[^/]+\.sql$/.test(norm) && existsSync(fp) && isTracked(fp)) {
  block(
    "Bloqueado: no se edita una migración ya aplicada (commit en git). " +
      "Crea una migración nueva con la skill `create-migration`.",
  );
}

process.exit(0);

#!/usr/bin/env node
// TrainFlow — PostToolUse reminder for Edit|Write.
// When a change lands in the data layer, feed Claude a reminder to run the
// RLS test and the review subagents before opening a PR (CLAUDE.md treats
// tests/unit/rls.test.ts as a spec).

import { readFileSync } from "node:fs";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const input = payload.tool_input ?? {};
const fp = String(input.file_path ?? input.path ?? "").replace(/\\/g, "/");
if (!fp) process.exit(0);

const dataLayer =
  /(^|\/)supabase\/migrations\//.test(fp) ||
  /(^|\/)src\/lib\/(actions|queries|supabase)\//.test(fp);

if (!dataLayer) process.exit(0);

const parts = [
  `Cambio en la capa de datos: ${fp}.`,
  "Antes de abrir PR: ejecuta `pnpm test:rls` y lanza el subagente `rls-reviewer` sobre el diff.",
];
if (/(^|\/)src\/lib\/(actions|queries)\//.test(fp)) {
  parts.push("Como toca acciones/queries, lanza también `server-action-reviewer`.");
}
if (/(^|\/)supabase\/migrations\//.test(fp)) {
  parts.push("Si el esquema cambió, regenera tipos con `pnpm db:types` y extiende `tests/unit/rls.test.ts`.");
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: parts.join(" "),
    },
  }),
);
process.exit(0);

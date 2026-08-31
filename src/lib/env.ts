import { z } from "zod";

/**
 * Validación de variables de entorno en el arranque (falla rápido y claro).
 * Las `NEXT_PUBLIC_*` se inlinean en el bundle; `SUPABASE_SERVICE_ROLE_KEY`
 * solo debe leerse desde código server-only.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!clientEnv.success) {
  throw new Error(
    `Variables de entorno inválidas o ausentes:\n${clientEnv.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}\n\nRevisa tu archivo .env.local (ver .env.example).`,
  );
}

export const env = clientEnv.data;

/** Lee la service_role key. Lanza si se invoca sin la variable definida. */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está definida (solo server-side).");
  }
  return key;
}

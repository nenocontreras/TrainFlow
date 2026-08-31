import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente con service_role: BYPASSEA RLS. Uso restringido a tareas
 * administrativas del servidor (jobs, seeds, tests de integración).
 * NUNCA importar desde código que llegue al cliente.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

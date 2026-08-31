import type { Database } from "@/lib/supabase/types";

export type Role = "coach" | "athlete";

export const ROLES: readonly Role[] = ["coach", "athlete"] as const;

export function isRole(value: unknown): value is Role {
  return value === "coach" || value === "athlete";
}

/** Ruta de aterrizaje tras autenticarse, según el rol. */
export function landingPathFor(role: Role): string {
  return role === "coach" ? "/dashboard" : "/hoy";
}

/** Fila de `profiles` tal como la devuelve Supabase, con `role` estrechado a `Role`. */
export type Profile = Omit<Database["public"]["Tables"]["profiles"]["Row"], "role"> & {
  role: Role;
};

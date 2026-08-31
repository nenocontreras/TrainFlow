/**
 * Fase 1 — verifica contra la DB real que:
 *  - el trigger handle_new_user() copia el rol del metadata a profiles.role
 *  - profiles.role es inmutable desde la API (usuario autenticado)
 *
 * Se salta sin credenciales de Supabase (ver rls.test.ts).
 */
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ready = Boolean(url && anonKey && serviceKey);

if (!ready) {
  describe.skip("Fase 1: rol de perfil (Supabase no disponible)", () => {
    it("saltado", () => expect(true).toBe(true));
  });
} else {
  runRoleSuite();
}

function runRoleSuite(): void {
  describe("Fase 1: rol de perfil", () => {
    const admin = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const stamp = Date.now();
    const createdUserIds: string[] = [];

    async function register(role: string): Promise<string> {
      const email = `role-${role}-${stamp}@trainflow.test`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: "Test-Passw0rd!",
        email_confirm: true,
        user_metadata: { full_name: `User ${role}`, role },
      });
      if (error) throw error;
      createdUserIds.push(data.user.id);
      return data.user.id;
    }

    afterAll(async () => {
      for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
    });

    it("registrarse como coach -> profiles.role = 'coach'", async () => {
      const id = await register("coach");
      const { data } = await admin.from("profiles").select("role").eq("id", id).single();
      expect(data?.role).toBe("coach");
    });

    it("rol inválido en el metadata -> cae a 'athlete'", async () => {
      const id = await register("superadmin");
      const { data } = await admin.from("profiles").select("role").eq("id", id).single();
      expect(data?.role).toBe("athlete");
    });

    it("un usuario no puede cambiarse el rol vía la API", async () => {
      const id = await register("athlete2");
      const asUser = createClient(url!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signInError } = await asUser.auth.signInWithPassword({
        email: `role-athlete2-${stamp}@trainflow.test`,
        password: "Test-Passw0rd!",
      });
      expect(signInError).toBeNull();

      const { data, error } = await asUser
        .from("profiles")
        .update({ role: "coach" })
        .eq("id", id)
        .select("role");
      // El trigger profiles_role_immutable rechaza el cambio: error o 0 filas.
      expect(Boolean(error) || (data ?? []).length === 0).toBe(true);

      const { data: after } = await admin.from("profiles").select("role").eq("id", id).single();
      expect(after?.role).toBe("athlete");
    });
  });
}

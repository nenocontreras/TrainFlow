import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRole, landingPathFor, type Profile, type Role } from "@/types";

export { landingPathFor };

/**
 * Usuario autenticado + su perfil, o `null`. El perfil lo crea el trigger al
 * registrarse; si por alguna razón no existe, devolvemos `null`.
 */
export async function getSessionUser(): Promise<{
  id: string;
  email: string;
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, created_at, role")
    .eq("id", user.id)
    .single();

  if (!profile || !isRole(profile.role)) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    profile: { ...profile, role: profile.role },
  };
}

/** Exige sesión; si no hay, va a /login. Devuelve el usuario. */
export async function requireUser() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

/** Exige un rol concreto; si el rol no coincide, redirige a su aterrizaje. */
export async function requireRole(role: Role) {
  const session = await requireUser();
  if (session.profile.role !== role) {
    redirect(landingPathFor(session.profile.role));
  }
  return session;
}

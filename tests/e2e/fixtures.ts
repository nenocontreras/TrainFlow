import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const E2E_READY = Boolean(url && anonKey && serviceKey);

export const E2E_PASSWORD = "E2e-Passw0rd!";
export const E2E_USERS = {
  coach: `e2e-coach@trainflow.test`,
  athlete: `e2e-athlete@trainflow.test`,
};

export function adminClient() {
  return createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function userIdByEmail(email: string): Promise<string | undefined> {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users?.find((u) => u.email === email)?.id;
}

/** Crea (idempotente) los usuarios confirmados que usan los tests e2e. */
export async function ensureE2EUsers(): Promise<void> {
  if (!E2E_READY) return;
  const admin = adminClient();
  const existing = new Set(
    ((await admin.auth.admin.listUsers({ perPage: 1000 })).data?.users ?? []).map((u) => u.email),
  );

  for (const [role, email] of Object.entries(E2E_USERS)) {
    if (existing.has(email)) continue;
    const { error } = await admin.auth.admin.createUser({
      email,
      password: E2E_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `E2E ${role}`, role },
    });
    if (error) throw error;
  }
}

/**
 * Deja a los usuarios e2e sin datos para que cada corrida empiece limpia.
 * Orden importante: `workout_sessions.plan_day_id` NO tiene `on delete cascade`,
 * así que hay que borrar las sesiones del atleta antes que los planes del coach.
 */
export async function resetE2ECoachData(): Promise<void> {
  if (!E2E_READY) return;
  const admin = adminClient();
  const [coachId, athleteId] = await Promise.all([
    userIdByEmail(E2E_USERS.coach),
    userIdByEmail(E2E_USERS.athlete),
  ]);

  if (athleteId) {
    await admin.from("workout_sessions").delete().eq("athlete_id", athleteId);
    await admin.from("plan_assignments").delete().eq("athlete_id", athleteId);
  }
  if (coachId) {
    await admin.from("training_plans").delete().eq("coach_id", coachId);
    await admin.from("exercise_library").delete().eq("coach_id", coachId);
    await admin.from("coach_athlete_relationships").delete().eq("coach_id", coachId);
  }
}

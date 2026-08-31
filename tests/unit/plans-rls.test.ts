/**
 * Fase 2 — RLS de biblioteca de ejercicios y planes (SPEC §6.3):
 *  - solo el coach dueño escribe/lee sus ejercicios y planes
 *  - otro coach no ve ni toca nada de eso
 *  - un atleta con asignación activa lee (solo lectura) el plan, sus días,
 *    ejercicios del plan y los ejercicios de biblioteca referenciados
 *
 * Se salta sin credenciales de Supabase.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ready = Boolean(url && anonKey && serviceKey);

if (!ready) {
  describe.skip("Fase 2: RLS de planes (Supabase no disponible)", () => {
    it("saltado", () => expect(true).toBe(true));
  });
} else {
  runPlansRlsSuite();
}

function runPlansRlsSuite(): void {
  describe("Fase 2: RLS de ejercicios y planes", () => {
    const admin = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const stamp = Date.now();
    const password = "Test-Passw0rd!";
    const userIds: string[] = [];

    const ctx = {
      coachA: "",
      coachB: "",
      athlete: "",
      exerciseId: "",
      planId: "",
      dayId: "",
      planExerciseId: "",
    };
    let clientA: SupabaseClient;
    let clientB: SupabaseClient;
    let clientAthlete: SupabaseClient;

    async function makeUser(tag: string, role: string): Promise<[string, SupabaseClient]> {
      const email = `p2-${tag}-${stamp}@trainflow.test`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: tag, role },
      });
      if (error) throw error;
      userIds.push(data.user.id);
      const client = createClient(url!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;
      return [data.user.id, client];
    }

    afterAll(async () => {
      for (const id of userIds) await admin.auth.admin.deleteUser(id);
    });

    it("coach A construye ejercicio + plan + día + ejercicio de plan", async () => {
      [ctx.coachA, clientA] = await makeUser("coachA", "coach");
      [ctx.coachB, clientB] = await makeUser("coachB", "coach");
      [ctx.athlete, clientAthlete] = await makeUser("athlete", "athlete");

      const rel = await admin.from("coach_athlete_relationships").insert({
        coach_id: ctx.coachA,
        athlete_id: ctx.athlete,
        status: "active",
      });
      expect(rel.error).toBeNull();

      const ex = await clientA
        .from("exercise_library")
        .insert({ coach_id: ctx.coachA, name: "Press banca", muscle_group: "Pecho" })
        .select("id")
        .single();
      expect(ex.error).toBeNull();
      ctx.exerciseId = ex.data!.id;

      const plan = await clientA
        .from("training_plans")
        .insert({ coach_id: ctx.coachA, name: "Full body" })
        .select("id")
        .single();
      expect(plan.error).toBeNull();
      ctx.planId = plan.data!.id;

      const day = await clientA
        .from("plan_days")
        .insert({ plan_id: ctx.planId, day_order: 1, label: "Día 1" })
        .select("id")
        .single();
      expect(day.error).toBeNull();
      ctx.dayId = day.data!.id;

      const pe = await clientA
        .from("plan_exercises")
        .insert({
          plan_day_id: ctx.dayId,
          exercise_id: ctx.exerciseId,
          exercise_order: 1,
          target_sets: 4,
          target_reps: "8-10",
        })
        .select("id")
        .single();
      expect(pe.error).toBeNull();
      ctx.planExerciseId = pe.data!.id;
    });

    it("coach B no ve ni toca los ejercicios ni planes de A", async () => {
      // Coach B puede ver ejercicios de sistema, pero NO los propios de A.
      const bLib = await clientB.from("exercise_library").select("id, coach_id");
      expect((bLib.data ?? []).some((e) => e.id === ctx.exerciseId)).toBe(false);
      expect((bLib.data ?? []).every((e) => e.coach_id === null)).toBe(true);

      expect((await clientB.from("training_plans").select("id")).data ?? []).toHaveLength(0);
      expect((await clientB.from("plan_days").select("id")).data ?? []).toHaveLength(0);

      const badDay = await clientB
        .from("plan_days")
        .insert({ plan_id: ctx.planId, day_order: 2, label: "Hack" });
      expect(badDay.error).not.toBeNull();

      const badUpdate = await clientB
        .from("training_plans")
        .update({ name: "Robado" })
        .eq("id", ctx.planId)
        .select("id");
      expect(badUpdate.data ?? []).toHaveLength(0);
    });

    it("el atleta sin asignación todavía no ve el plan", async () => {
      expect((await clientAthlete.from("training_plans").select("id")).data ?? []).toHaveLength(0);
    });

    it("tras asignar, el atleta lee (solo lectura) plan, día, ejercicios y biblioteca", async () => {
      const assign = await clientA.from("plan_assignments").insert({
        plan_id: ctx.planId,
        athlete_id: ctx.athlete,
        start_date: "2026-01-01",
        active: true,
      });
      expect(assign.error).toBeNull();

      expect((await clientAthlete.from("training_plans").select("id")).data ?? []).toHaveLength(1);
      expect((await clientAthlete.from("plan_days").select("id")).data ?? []).toHaveLength(1);
      expect((await clientAthlete.from("plan_exercises").select("id")).data ?? []).toHaveLength(1);

      // El atleta ve el ejercicio de A porque está en su plan asignado.
      const lib = await clientAthlete
        .from("exercise_library")
        .select("id, name")
        .eq("id", ctx.exerciseId);
      expect(lib.data ?? []).toHaveLength(1);
      expect(lib.data?.[0]?.name).toBe("Press banca");

      const athleteEdit = await clientAthlete
        .from("training_plans")
        .update({ name: "no" })
        .eq("id", ctx.planId)
        .select("id");
      expect(athleteEdit.data ?? []).toHaveLength(0);
    });
  });
}

/**
 * Prueba de aislamiento por Row Level Security (sección 6.3 del SPEC + criterio
 * de aceptación del MVP: "un atleta no puede leer ni escribir datos de otro
 * atleta ni de planes que no le pertenecen").
 *
 * Requiere una instancia Supabase accesible con:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Para local: `pnpm db:start && pnpm db:reset` y copia las claves a `.env.local`.
 * Si no están definidas, el bloque se salta (no rompe el resto de la suite).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ready = Boolean(url && anonKey && serviceKey);

if (!ready) {
  console.warn(
    "[rls.test] Variables de Supabase ausentes — prueba de RLS saltada. " +
      "Ejecuta `pnpm db:start` y configura `.env.local`.",
  );
  describe.skip("RLS: aislamiento entre atletas y visibilidad del coach (Supabase no disponible)", () => {
    it("saltado", () => {
      expect(true).toBe(true);
    });
  });
} else {
  describeRlsSuite();
}

function describeRlsSuite(): void {
  describe("RLS: aislamiento entre atletas y visibilidad del coach", () => {
    const stamp = Date.now();
    const password = "Test-Passw0rd!";
    const emails = {
      coach: `coach-${stamp}@trainflow.test`,
      athleteA: `athlete-a-${stamp}@trainflow.test`,
      athleteB: `athlete-b-${stamp}@trainflow.test`,
    };

    const admin = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ids: { coach: string; athleteA: string; athleteB: string } = {
      coach: "",
      athleteA: "",
      athleteB: "",
    };
    const ctx: {
      planId: string;
      planDayId: string;
      assignmentAId: string;
      sessionAId: string;
    } = { planId: "", planDayId: "", assignmentAId: "", sessionAId: "" };

    let clientA: SupabaseClient;
    let clientB: SupabaseClient;
    let clientCoach: SupabaseClient;

    async function createUser(
      email: string,
      fullName: string,
      role: "coach" | "athlete" = "athlete",
    ): Promise<string> {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });
      if (error) throw error;
      return data.user.id;
    }

    async function signIn(email: string): Promise<SupabaseClient> {
      const client = createClient(url!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return client;
    }

    beforeAll(async () => {
      ids.coach = await createUser(emails.coach, "Coach Test", "coach");
      ids.athleteA = await createUser(emails.athleteA, "Athlete A");
      ids.athleteB = await createUser(emails.athleteB, "Athlete B");

      // Relación coach -> atleta A (activa). Atleta B queda sin relación.
      const rel = await admin.from("coach_athlete_relationships").insert({
        coach_id: ids.coach,
        athlete_id: ids.athleteA,
        status: "active",
      });
      if (rel.error) throw rel.error;

      const plan = await admin
        .from("training_plans")
        .insert({ coach_id: ids.coach, name: "Plan de prueba" })
        .select("id")
        .single();
      if (plan.error) throw plan.error;
      ctx.planId = plan.data.id;

      const day = await admin
        .from("plan_days")
        .insert({ plan_id: ctx.planId, day_order: 1, label: "Día 1" })
        .select("id")
        .single();
      if (day.error) throw day.error;
      ctx.planDayId = day.data.id;

      const assignment = await admin
        .from("plan_assignments")
        .insert({
          plan_id: ctx.planId,
          athlete_id: ids.athleteA,
          start_date: "2026-01-01",
          active: true,
        })
        .select("id")
        .single();
      if (assignment.error) throw assignment.error;
      ctx.assignmentAId = assignment.data.id;

      clientA = await signIn(emails.athleteA);
      clientB = await signIn(emails.athleteB);
      clientCoach = await signIn(emails.coach);
    }, 30_000);

    afterAll(async () => {
      for (const id of [ids.coach, ids.athleteA, ids.athleteB]) {
        if (id) await admin.auth.admin.deleteUser(id);
      }
    });

    it("el atleta A puede registrar su propia sesión", async () => {
      const { data, error } = await clientA
        .from("workout_sessions")
        .insert({
          plan_assignment_id: ctx.assignmentAId,
          plan_day_id: ctx.planDayId,
          athlete_id: ids.athleteA,
          athlete_note: "hoy me costó la serie 3",
        })
        .select("id")
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBeTruthy();
      ctx.sessionAId = data!.id;

      const set = await clientA.from("session_sets").insert({
        workout_session_id: ctx.sessionAId,
        plan_exercise_id: null,
        set_number: 1,
        actual_reps: 10,
        actual_weight_kg: 60,
        completed: true,
      });
      expect(set.error).toBeNull();
    });

    it("no puede haber dos sesiones el mismo día para la misma asignación", async () => {
      // La primera sesión se creó en el test anterior (hoy). Una segunda choca
      // con idx_workout_sessions_one_per_day (migración 0009).
      const { error } = await clientA.from("workout_sessions").insert({
        plan_assignment_id: ctx.assignmentAId,
        plan_day_id: ctx.planDayId,
        athlete_id: ids.athleteA,
      });
      expect(error?.code).toBe("23505");
    });

    it("SÍ puede haber otra sesión de la misma asignación en OTRO día", async () => {
      // El índice es por (asignación, fecha): una sesión pasada no bloquea.
      const { data, error } = await clientA
        .from("workout_sessions")
        .insert({
          plan_assignment_id: ctx.assignmentAId,
          plan_day_id: ctx.planDayId,
          athlete_id: ids.athleteA,
          performed_at: "2025-12-01T09:00:00Z",
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      if (data?.id) await admin.from("workout_sessions").delete().eq("id", data.id);
    });

    it("el coach SÍ puede leer las series de su atleta (gráfica de progreso)", async () => {
      const { data, error } = await clientCoach
        .from("session_sets")
        .select("id, actual_weight_kg, completed");
      expect(error).toBeNull();
      expect((data ?? []).length).toBeGreaterThanOrEqual(1);
    });

    it("el coach NO puede escribir en session_sets (solo lectura, SPEC §6.3)", async () => {
      const { data: updated } = await clientCoach
        .from("session_sets")
        .update({ actual_weight_kg: 999 })
        .eq("workout_session_id", ctx.sessionAId)
        .select("id");
      expect(updated ?? []).toHaveLength(0);

      const { error: insErr } = await clientCoach.from("session_sets").insert({
        workout_session_id: ctx.sessionAId,
        set_number: 99,
      });
      expect(insErr).not.toBeNull();
    });

    it("el atleta B NO puede leer las sesiones del atleta A", async () => {
      const { data, error } = await clientB.from("workout_sessions").select("id");
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    });

    it("el atleta B NO puede leer las series del atleta A", async () => {
      const { data } = await clientB.from("session_sets").select("id");
      expect(data ?? []).toHaveLength(0);
    });

    it("el atleta B NO puede insertar una sesión a nombre del atleta A", async () => {
      const { error } = await clientB.from("workout_sessions").insert({
        plan_assignment_id: ctx.assignmentAId,
        plan_day_id: ctx.planDayId,
        athlete_id: ids.athleteA,
      });
      expect(error).not.toBeNull();
    });

    it("el atleta B NO puede colgar una sesión suya de la asignación de A", async () => {
      // athlete_id = B (uno mismo) pero plan_assignment_id de A -> debe fallar
      // (migración 0008: athlete_owns_assignment).
      const { error } = await clientB.from("workout_sessions").insert({
        plan_assignment_id: ctx.assignmentAId,
        plan_day_id: ctx.planDayId,
        athlete_id: ids.athleteB,
      });
      expect(error).not.toBeNull();
    });

    it("el atleta B NO puede leer un plan que no tiene asignado", async () => {
      const { data } = await clientB.from("training_plans").select("id");
      expect(data ?? []).toHaveLength(0);
    });

    it("el atleta A SÍ puede leer su plan asignado", async () => {
      const { data } = await clientA.from("training_plans").select("id");
      expect(data ?? []).toHaveLength(1);
      expect(data?.[0]?.id).toBe(ctx.planId);
    });

    it("el coach SÍ puede leer (solo lectura) las sesiones de su atleta", async () => {
      const { data, error } = await clientCoach.from("workout_sessions").select("id, athlete_note");
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(1);
      expect(data?.[0]?.athlete_note).toBe("hoy me costó la serie 3");
    });

    it("el coach NO puede modificar la sesión de su atleta", async () => {
      const { data } = await clientCoach
        .from("workout_sessions")
        .update({ athlete_note: "editado por el coach" })
        .eq("id", ctx.sessionAId)
        .select("id");
      // RLS sin política de UPDATE para el coach => 0 filas afectadas.
      expect(data ?? []).toHaveLength(0);
    });

    // --- Fase 3: vínculo por email y asignación de planes -------------------

    it("un atleta NO puede usar link_athlete_by_email", async () => {
      const { error } = await clientA.rpc("link_athlete_by_email", {
        _email: emails.athleteB,
      });
      expect(error).not.toBeNull();
    });

    it("el coach vincula al atleta B por email", async () => {
      const { data, error } = await clientCoach.rpc("link_athlete_by_email", {
        _email: emails.athleteB.toUpperCase(), // se normaliza
      });
      expect(error).toBeNull();
      expect(data?.id).toBe(ids.athleteB);
    });

    it("el coach NO puede asignar su plan a un atleta que no es suyo", async () => {
      // El test anterior vinculó a B; lo desvinculamos para comprobar la policy.
      await admin
        .from("coach_athlete_relationships")
        .delete()
        .eq("coach_id", ids.coach)
        .eq("athlete_id", ids.athleteB);

      const { error } = await clientCoach.from("plan_assignments").insert({
        plan_id: ctx.planId,
        athlete_id: ids.athleteB,
        start_date: "2026-02-01",
      });
      expect(error).not.toBeNull();
    });

    it("el coach SÍ puede asignar su plan a un atleta vinculado", async () => {
      await admin.from("coach_athlete_relationships").insert({
        coach_id: ids.coach,
        athlete_id: ids.athleteB,
        status: "active",
      });

      const { error } = await clientCoach.from("plan_assignments").insert({
        plan_id: ctx.planId,
        athlete_id: ids.athleteB,
        start_date: "2026-02-01",
      });
      expect(error).toBeNull();
    });

    it("no puede haber dos asignaciones activas del mismo plan al mismo atleta", async () => {
      const { error } = await clientCoach.from("plan_assignments").insert({
        plan_id: ctx.planId,
        athlete_id: ids.athleteA, // ya tiene una activa (beforeAll)
        start_date: "2026-03-01",
      });
      expect(error).not.toBeNull(); // choca con idx_plan_assignments_active_unique
    });

    // --- Chat coach ↔ atleta (migraciones 0011 + 0012 + 0013) ------------

    it("un atleta NO puede forjar un vínculo coach-atleta (migración 0013)", async () => {
      // Antes de 0013, B podía insertarse `{coach_id: B, athlete_id: A}` y con eso
      // abrir un hilo y leer el perfil de A. Ahora no hay política de INSERT.
      const forge = await clientB.from("coach_athlete_relationships").insert({
        coach_id: ids.athleteB,
        athlete_id: ids.athleteA,
        status: "active",
      });
      expect(forge.error).not.toBeNull();

      // Y por tanto sigue sin poder leer el perfil ni los mensajes de A.
      const prof = await clientB.from("profiles").select("id").eq("id", ids.athleteA).maybeSingle();
      expect(prof.data).toBeNull();

      const msgs = await clientB.from("messages").select("id").eq("athlete_id", ids.athleteA);
      expect(msgs.data ?? []).toHaveLength(0);
    });

    it("un cliente anónimo no puede leer mensajes", async () => {
      const anon = createClient(url!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await anon.from("messages").select("id");
      expect(data ?? []).toHaveLength(0);
    });

    it("el atleta A puede leer el perfil de su coach (migración 0012)", async () => {
      const { data } = await clientA
        .from("profiles")
        .select("id, full_name")
        .eq("id", ids.coach)
        .maybeSingle();
      expect(data?.full_name).toBe("Coach Test");
    });

    it("el atleta A NO puede leer el perfil del atleta B (sin relación)", async () => {
      const { data } = await clientA
        .from("profiles")
        .select("id")
        .eq("id", ids.athleteB)
        .maybeSingle();
      expect(data).toBeNull();
    });

    it("el atleta A escribe en su hilo con el coach y el coach lo lee", async () => {
      const ins = await clientA.from("messages").insert({
        coach_id: ids.coach,
        athlete_id: ids.athleteA,
        sender_id: ids.athleteA,
        body: "Hola coach, ¿subo el peso en sentadilla?",
      });
      expect(ins.error).toBeNull();

      const { data } = await clientCoach
        .from("messages")
        .select("body, sender_id")
        .eq("athlete_id", ids.athleteA);
      expect((data ?? []).map((m) => m.body)).toContain("Hola coach, ¿subo el peso en sentadilla?");
    });

    it("el coach responde en el hilo y el atleta A lo lee", async () => {
      const ins = await clientCoach.from("messages").insert({
        coach_id: ids.coach,
        athlete_id: ids.athleteA,
        sender_id: ids.coach,
        body: "Sí, +2.5 kg esta semana.",
      });
      expect(ins.error).toBeNull();

      const { data } = await clientA.from("messages").select("body").eq("coach_id", ids.coach);
      expect((data ?? []).map((m) => m.body)).toContain("Sí, +2.5 kg esta semana.");
    });

    it("el atleta B NO puede leer el hilo de A con el coach", async () => {
      const { data } = await clientB.from("messages").select("id").eq("athlete_id", ids.athleteA);
      expect(data ?? []).toHaveLength(0);
    });

    it("el atleta B NO puede escribir en el hilo de A con el coach", async () => {
      const { error } = await clientB.from("messages").insert({
        coach_id: ids.coach,
        athlete_id: ids.athleteA,
        sender_id: ids.athleteB,
        body: "intruso",
      });
      expect(error).not.toBeNull();
    });

    it("nadie puede suplantar a otro como sender_id", async () => {
      const { error } = await clientA.from("messages").insert({
        coach_id: ids.coach,
        athlete_id: ids.athleteA,
        sender_id: ids.coach, // A intenta escribir "como el coach"
        body: "firmado por el coach",
      });
      expect(error).not.toBeNull();
    });

    it("los mensajes son inmutables (sin update ni delete)", async () => {
      const { data: mine } = await clientA
        .from("messages")
        .select("id")
        .eq("sender_id", ids.athleteA)
        .limit(1)
        .maybeSingle();
      expect(mine?.id).toBeTruthy();

      const upd = await clientA
        .from("messages")
        .update({ body: "editado" })
        .eq("id", mine!.id)
        .select("id");
      expect(upd.data ?? []).toHaveLength(0);

      const del = await clientA.from("messages").delete().eq("id", mine!.id).select("id");
      expect(del.data ?? []).toHaveLength(0);
    });

    // --- Fase 4: on delete set null en el historial (migración 0009) --------
    // Este bloque borra ctx.planDayId — debe ir el último.

    it("el coach borra un día ya entrenado y la sesión sobrevive con plan_day_id NULL", async () => {
      const del = await clientCoach.from("plan_days").delete().eq("id", ctx.planDayId).select("id");
      expect(del.error).toBeNull();
      expect(del.data ?? []).toHaveLength(1); // antes de 0009 fallaba por FK

      // La sesión histórica del atleta A sigue ahí, con la referencia a null.
      const { data } = await clientA
        .from("workout_sessions")
        .select("id, plan_day_id")
        .eq("id", ctx.sessionAId)
        .maybeSingle();
      expect(data?.id).toBe(ctx.sessionAId);
      expect(data?.plan_day_id).toBeNull();

      // El aislamiento no se relaja: B sigue sin poder leerla.
      const bView = await clientB.from("workout_sessions").select("id").eq("id", ctx.sessionAId);
      expect(bView.data ?? []).toHaveLength(0);

      // El coach mantiene su lectura de solo lectura.
      const coachView = await clientCoach
        .from("workout_sessions")
        .select("id")
        .eq("id", ctx.sessionAId);
      expect(coachView.data ?? []).toHaveLength(1);
    });
  });
}

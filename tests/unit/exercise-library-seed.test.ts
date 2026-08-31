/**
 * Verifica la biblioteca base de ejercicios de sistema (coach_id IS NULL)
 * sembrada por supabase/seed_exercises.sql. Se salta sin credenciales.
 */
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ready = Boolean(url && serviceKey);

(ready ? describe : describe.skip)("Biblioteca base de ejercicios", () => {
  const admin = createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  it("hay al menos 40 ejercicios de sistema, completos y sin nombres repetidos", async () => {
    const { data, error } = await admin
      .from("exercise_library")
      .select("name, muscle_group, movement_pattern, equipment, video_url")
      .is("coach_id", null);

    expect(error).toBeNull();
    const rows = data ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(40);

    for (const r of rows) {
      expect(r.muscle_group, r.name).toBeTruthy();
      expect(r.movement_pattern, r.name).toBeTruthy();
      expect(r.equipment, r.name).toBeTruthy();
      expect(r.video_url, r.name).toMatch(/^https?:\/\//);
    }

    const names = rows.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("cubre varios grupos musculares y tipos de equipamiento", async () => {
    const { data } = await admin
      .from("exercise_library")
      .select("muscle_group, equipment")
      .is("coach_id", null);
    const groups = new Set((data ?? []).map((r) => r.muscle_group));
    const equip = new Set((data ?? []).map((r) => r.equipment));
    expect(groups.size).toBeGreaterThanOrEqual(6);
    expect(equip.size).toBeGreaterThanOrEqual(5);
    expect(equip).toContain("Peso corporal");
  });
});

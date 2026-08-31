"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { finishSessionSchema, logSetSchema, startSessionSchema } from "@/lib/validations/sessions";
import type { ActionState } from "@/lib/actions/exercises";

export type { ActionState };

const uuid = z.guid();

export async function startSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id: athleteId } = await requireRole("athlete");
  const parsed = startSessionSchema.safeParse({
    planAssignmentId: formData.get("planAssignmentId"),
    planDayId: formData.get("planDayId"),
  });
  if (!parsed.success) return { error: "Datos no válidos." };

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Una sesión por día y asignación.
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("plan_assignment_id", parsed.data.planAssignmentId)
    .gte("performed_at", `${today}T00:00:00`)
    .limit(1)
    .maybeSingle();
  if (existing) {
    revalidatePath("/hoy");
    return { ok: true };
  }

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      plan_assignment_id: parsed.data.planAssignmentId,
      plan_day_id: parsed.data.planDayId,
      athlete_id: athleteId,
    })
    .select("id")
    .single();
  if (error || !session) return { error: "No se pudo empezar la sesión." };

  const { data: exercises } = await supabase
    .from("plan_exercises")
    .select("id, target_sets")
    .eq("plan_day_id", parsed.data.planDayId);

  const rows = (exercises ?? []).flatMap((ex) =>
    Array.from({ length: Math.max(1, ex.target_sets) }, (_, i) => ({
      workout_session_id: session.id,
      plan_exercise_id: ex.id,
      set_number: i + 1,
      completed: false,
    })),
  );
  if (rows.length > 0) {
    const { error: setsError } = await supabase.from("session_sets").insert(rows);
    if (setsError) {
      await supabase.from("workout_sessions").delete().eq("id", session.id);
      return { error: "No se pudo preparar la sesión." };
    }
  }

  revalidatePath("/hoy");
  return { ok: true };
}

export async function logSetAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireRole("athlete");
  const parsed = logSetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Serie no válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("session_sets")
    .update({
      actual_reps: parsed.data.actualReps ?? null,
      actual_weight_kg: parsed.data.actualWeightKg ?? null,
      completed: parsed.data.completed,
    })
    .eq("id", parsed.data.setId);
  if (error) return { ok: false, error: "No se pudo guardar la serie." };

  revalidatePath("/hoy");
  return { ok: true };
}

export async function finishSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("athlete");
  const parsed = finishSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    athleteNote: formData.get("athleteNote"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ athlete_note: parsed.data.athleteNote ?? null })
    .eq("id", parsed.data.sessionId);
  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath("/hoy");
  revalidatePath("/historial");
  return { ok: true };
}

export async function discardSessionAction(formData: FormData): Promise<void> {
  await requireRole("athlete");
  const sessionId = uuid.safeParse(formData.get("sessionId"));
  if (!sessionId.success) return;

  const supabase = await createClient();
  await supabase.from("workout_sessions").delete().eq("id", sessionId.data);
  revalidatePath("/hoy");
  revalidatePath("/historial");
}

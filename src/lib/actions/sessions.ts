"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { finishSessionSchema, logSetSchema, startSessionSchema } from "@/lib/validations/sessions";
import type { ActionState } from "@/lib/actions/exercises";

export type { ActionState };

const uuid = z.guid();

function revalidateSession() {
  revalidatePath("/hoy");
  revalidatePath("/historial");
}

export async function startSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id: athleteId } = await requireRole("athlete");
  const parsed = startSessionSchema.safeParse({
    planAssignmentId: formData.get("planAssignmentId"),
    planDayId: formData.get("planDayId"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Una sesión por día y asignación. (Sin índice único: se comprueba aquí; el
  // botón queda deshabilitado mientras se envía. Endurecer con un índice parcial
  // sobre (plan_assignment_id, performed_at::date) es deuda anotada.)
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("plan_assignment_id", parsed.data.planAssignmentId)
    .gte("performed_at", `${today}T00:00:00`)
    .limit(1)
    .maybeSingle();
  if (existing) {
    revalidateSession();
    return { ok: true };
  }

  // Los ejercicios del día ANTES de crear la sesión: si falla o el día está
  // vacío, no dejamos una sesión sin series que el atleta no puede registrar.
  const { data: exercises, error: exError } = await supabase
    .from("plan_exercises")
    .select("id, target_sets, exercise_order")
    .eq("plan_day_id", parsed.data.planDayId)
    .order("exercise_order", { ascending: true });
  if (exError) return { error: "No se pudieron cargar los ejercicios del día." };
  if (!exercises || exercises.length === 0) {
    return { error: "Este día no tiene ejercicios." };
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

  const rows = exercises.flatMap((ex) =>
    Array.from({ length: Math.max(1, ex.target_sets) }, (_, i) => ({
      workout_session_id: session.id,
      plan_exercise_id: ex.id,
      set_number: i + 1,
      completed: false,
    })),
  );
  const { error: setsError } = await supabase.from("session_sets").insert(rows);
  if (setsError) {
    await supabase.from("workout_sessions").delete().eq("id", session.id);
    return { error: "No se pudo preparar la sesión." };
  }

  revalidateSession();
  return { ok: true };
}

/**
 * Registro de una serie. NO usa la forma `(prev, FormData)` ni devuelve
 * `ActionState` completo: es el punto de entrada del `useOptimistic` de
 * `today-view.tsx`, que la llama con un objeto y solo mira `ok` / `error`.
 * La seguridad la da RLS (`athlete_owns_session` sobre `session_sets`).
 */
export async function logSetAction(input: unknown): Promise<ActionState> {
  await requireRole("athlete");
  const parsed = logSetSchema.safeParse(input);
  if (!parsed.success) return { error: "Serie no válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("session_sets")
    .update({
      actual_reps: parsed.data.actualReps ?? null,
      actual_weight_kg: parsed.data.actualWeightKg ?? null,
      completed: parsed.data.completed,
    })
    .eq("id", parsed.data.setId);
  if (error) return { error: "No se pudo guardar la serie." };

  revalidateSession();
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

  revalidateSession();
  return { ok: true };
}

export async function discardSessionAction(formData: FormData): Promise<void> {
  await requireRole("athlete");
  const sessionId = uuid.safeParse(formData.get("sessionId"));
  if (!sessionId.success) return;

  const supabase = await createClient();
  await supabase.from("workout_sessions").delete().eq("id", sessionId.data);
  revalidateSession();
}

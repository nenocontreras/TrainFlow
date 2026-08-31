"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { planDaySchema, planExerciseSchema, planSchema } from "@/lib/validations/plan";
import { move, nextOrder, type Ordered } from "@/lib/ordering";
import type { ActionState } from "@/lib/actions/exercises";

export type { ActionState };

const uuid = z.guid();

function revalidatePlan(planId: string) {
  revalidatePath("/planes");
  revalidatePath(`/planes/${planId}`);
}

// --- Plan --------------------------------------------------------------------

export async function createPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id: coachId } = await requireRole("coach");
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationWeeks: formData.get("durationWeeks"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_plans")
    .insert({
      coach_id: coachId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      duration_weeks: parsed.data.durationWeeks ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No se pudo crear el plan." };

  revalidatePath("/planes");
  redirect(`/planes/${data.id}`);
}

export async function updatePlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  if (!planId.success) return { error: "Plan no válido." };
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationWeeks: formData.get("durationWeeks"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("training_plans")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      duration_weeks: parsed.data.durationWeeks ?? null,
    })
    .eq("id", planId.data);
  if (error) return { error: "No se pudo guardar el plan." };

  revalidatePlan(planId.data);
  return { ok: true };
}

export async function setPlanArchivedAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const archived = formData.get("archived") === "true";
  if (!planId.success) return;

  const supabase = await createClient();
  await supabase.from("training_plans").update({ archived }).eq("id", planId.data);
  revalidatePlan(planId.data);
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  if (!planId.success) return;

  const supabase = await createClient();

  // No borrar un plan con atletas asignados: al hacer cascade se perderían sus
  // sesiones registradas (SPEC §4). En ese caso, archivar.
  const { count } = await supabase
    .from("plan_assignments")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId.data);
  if ((count ?? 0) > 0) {
    revalidatePlan(planId.data);
    redirect(`/planes/${planId.data}`);
  }

  await supabase.from("training_plans").delete().eq("id", planId.data);
  revalidatePath("/planes");
  redirect("/planes");
}

// --- Días -------------------------------------------------------------------

async function loadDayOrder(planId: string): Promise<Ordered[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plan_days").select("id, day_order").eq("plan_id", planId);
  return (data ?? []).map((d) => ({ id: d.id, order: d.day_order }));
}

export async function addDayAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  if (!planId.success) return { error: "Plan no válido." };
  const parsed = planDaySchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("plan_days").insert({
    plan_id: planId.data,
    label: parsed.data.label,
    day_order: nextOrder(await loadDayOrder(planId.data)),
  });
  if (error) return { error: "No se pudo añadir el día." };

  revalidatePlan(planId.data);
  return { ok: true };
}

export async function renameDayAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const dayId = uuid.safeParse(formData.get("dayId"));
  if (!planId.success || !dayId.success) return { error: "Datos no válidos." };
  const parsed = planDaySchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_days")
    .update({ label: parsed.data.label })
    .eq("id", dayId.data);
  if (error) return { error: "No se pudo renombrar el día." };

  revalidatePlan(planId.data);
  return { ok: true };
}

export async function deleteDayAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const dayId = uuid.safeParse(formData.get("dayId"));
  if (!planId.success || !dayId.success) return;

  const supabase = await createClient();
  await supabase.from("plan_days").delete().eq("id", dayId.data);

  // Renumera los días restantes 1..N.
  const remaining = (await loadDayOrder(planId.data)).sort((a, b) => a.order - b.order);
  await Promise.all(
    remaining.map((d, i) =>
      supabase
        .from("plan_days")
        .update({ day_order: i + 1 })
        .eq("id", d.id),
    ),
  );
  revalidatePlan(planId.data);
}

export async function moveDayAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const dayId = uuid.safeParse(formData.get("dayId"));
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!planId.success || !dayId.success) return;

  const supabase = await createClient();
  const reordered = move(await loadDayOrder(planId.data), dayId.data, direction);
  await Promise.all(
    reordered.map((d) => supabase.from("plan_days").update({ day_order: d.order }).eq("id", d.id)),
  );
  revalidatePlan(planId.data);
}

// --- Ejercicios del plan ---------------------------------------------------

async function loadExerciseOrder(dayId: string): Promise<Ordered[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plan_exercises")
    .select("id, exercise_order")
    .eq("plan_day_id", dayId);
  return (data ?? []).map((e) => ({ id: e.id, order: e.exercise_order }));
}

export async function addPlanExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const dayId = uuid.safeParse(formData.get("dayId"));
  if (!planId.success || !dayId.success) return { error: "Datos no válidos." };
  const parsed = planExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    targetSets: formData.get("targetSets"),
    targetReps: formData.get("targetReps"),
    targetRestSeconds: formData.get("targetRestSeconds"),
    coachNotes: formData.get("coachNotes"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("plan_exercises").insert({
    plan_day_id: dayId.data,
    exercise_id: parsed.data.exerciseId,
    exercise_order: nextOrder(await loadExerciseOrder(dayId.data)),
    target_sets: parsed.data.targetSets,
    target_reps: parsed.data.targetReps,
    target_rest_seconds: parsed.data.targetRestSeconds ?? null,
    coach_notes: parsed.data.coachNotes ?? null,
  });
  if (error) return { error: "No se pudo añadir el ejercicio." };

  revalidatePlan(planId.data);
  return { ok: true };
}

export async function updatePlanExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const id = uuid.safeParse(formData.get("id"));
  if (!planId.success || !id.success) return { error: "Datos no válidos." };
  const parsed = planExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    targetSets: formData.get("targetSets"),
    targetReps: formData.get("targetReps"),
    targetRestSeconds: formData.get("targetRestSeconds"),
    coachNotes: formData.get("coachNotes"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_exercises")
    .update({
      exercise_id: parsed.data.exerciseId,
      target_sets: parsed.data.targetSets,
      target_reps: parsed.data.targetReps,
      target_rest_seconds: parsed.data.targetRestSeconds ?? null,
      coach_notes: parsed.data.coachNotes ?? null,
    })
    .eq("id", id.data);
  if (error) return { error: "No se pudo guardar el ejercicio." };

  revalidatePlan(planId.data);
  return { ok: true };
}

export async function removePlanExerciseAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const dayId = uuid.safeParse(formData.get("dayId"));
  const id = uuid.safeParse(formData.get("id"));
  if (!planId.success || !dayId.success || !id.success) return;

  const supabase = await createClient();
  await supabase.from("plan_exercises").delete().eq("id", id.data);

  const remaining = (await loadExerciseOrder(dayId.data)).sort((a, b) => a.order - b.order);
  await Promise.all(
    remaining.map((e, i) =>
      supabase
        .from("plan_exercises")
        .update({ exercise_order: i + 1 })
        .eq("id", e.id),
    ),
  );
  revalidatePlan(planId.data);
}

export async function movePlanExerciseAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const planId = uuid.safeParse(formData.get("planId"));
  const dayId = uuid.safeParse(formData.get("dayId"));
  const id = uuid.safeParse(formData.get("id"));
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!planId.success || !dayId.success || !id.success) return;

  const supabase = await createClient();
  const reordered = move(await loadExerciseOrder(dayId.data), id.data, direction);
  await Promise.all(
    reordered.map((e) =>
      supabase.from("plan_exercises").update({ exercise_order: e.order }).eq("id", e.id),
    ),
  );
  revalidatePlan(planId.data);
}

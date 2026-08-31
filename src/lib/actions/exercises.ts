"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { exerciseSchema } from "@/lib/validations/exercise";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function parseExercise(formData: FormData) {
  return exerciseSchema.safeParse({
    name: formData.get("name"),
    muscleGroup: formData.get("muscleGroup"),
    instructions: formData.get("instructions"),
    videoUrl: formData.get("videoUrl"),
  });
}

export async function createExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id: coachId } = await requireRole("coach");
  const parsed = parseExercise(formData);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("exercise_library").insert({
    coach_id: coachId,
    name: parsed.data.name,
    muscle_group: parsed.data.muscleGroup ?? null,
    instructions: parsed.data.instructions ?? null,
    video_url: parsed.data.videoUrl ?? null,
  });
  if (error) return { error: "No se pudo guardar el ejercicio." };

  revalidatePath("/ejercicios");
  return { ok: true };
}

export async function updateExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Ejercicio no válido." };
  const parsed = parseExercise(formData);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_library")
    .update({
      name: parsed.data.name,
      muscle_group: parsed.data.muscleGroup ?? null,
      instructions: parsed.data.instructions ?? null,
      video_url: parsed.data.videoUrl ?? null,
    })
    .eq("id", id.data);
  if (error) return { error: "No se pudo actualizar el ejercicio." };

  revalidatePath("/ejercicios");
  return { ok: true };
}

export async function deleteExerciseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Ejercicio no válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("exercise_library").delete().eq("id", id.data);
  if (error) {
    return {
      error: "No se puede eliminar: el ejercicio está usado en uno o más planes.",
    };
  }
  revalidatePath("/ejercicios");
  return { ok: true };
}

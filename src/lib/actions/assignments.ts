"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { assignPlanSchema } from "@/lib/validations/assignments";
import type { ActionState } from "@/lib/actions/exercises";

export type { ActionState };

const uuid = z.guid();

export async function assignPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const parsed = assignPlanSchema.safeParse({
    planId: formData.get("planId"),
    athleteId: formData.get("athleteId"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("plan_assignments").insert({
    plan_id: parsed.data.planId,
    athlete_id: parsed.data.athleteId,
    start_date: parsed.data.startDate,
    active: true,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Este atleta ya tiene ese plan asignado."
          : "No se pudo asignar el plan.",
    };
  }

  revalidatePath(`/atletas/${parsed.data.athleteId}`);
  revalidatePath("/atletas");
  return { ok: true };
}

/** Desactiva una asignación (no la borra: conserva las sesiones registradas). */
export async function unassignPlanAction(formData: FormData): Promise<void> {
  await requireRole("coach");
  const assignmentId = uuid.safeParse(formData.get("assignmentId"));
  const athleteId = uuid.safeParse(formData.get("athleteId"));
  if (!assignmentId.success) return;

  const supabase = await createClient();
  await supabase.from("plan_assignments").update({ active: false }).eq("id", assignmentId.data);

  if (athleteId.success) revalidatePath(`/atletas/${athleteId.data}`);
  revalidatePath("/atletas");
}

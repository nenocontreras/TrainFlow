"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { linkAthleteSchema } from "@/lib/validations/athletes";
import type { ActionState } from "@/lib/actions/exercises";

export type { ActionState };

// Mensajes en español que levanta link_athlete_by_email (SQLSTATE propios).
const KNOWN_LINK_ERRORS = new Set(["TF401", "TF404", "TF409"]);

export async function linkAthleteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("coach");
  const parsed = linkAthleteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.rpc("link_athlete_by_email", { _email: parsed.data.email });

  if (error) {
    return {
      error: KNOWN_LINK_ERRORS.has(error.code ?? "")
        ? error.message
        : "No se pudo vincular al atleta.",
    };
  }

  revalidatePath("/atletas");
  return { ok: true };
}

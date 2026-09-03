"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { sendMessageSchema, type SendResult } from "@/lib/validations/messages";

/**
 * Envía un mensaje en el hilo identificado por `athleteId`. Vale para las dos
 * partes: el emisor es siempre `auth.uid()` y el hilo se resuelve desde la
 * relación coach↔atleta activa. La seguridad real la da RLS
 * (`messages_insert_sender` + `in_coach_thread`).
 */
export async function sendMessageAction(athleteId: string, body: string): Promise<SendResult> {
  const { id: me } = await requireUser();

  const parsed = sendMessageSchema.safeParse({ athleteId, body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensaje no válido." };
  }

  const supabase = await createClient();

  const { data: rel } = await supabase
    .from("coach_athlete_relationships")
    .select("coach_id, athlete_id")
    .eq("athlete_id", parsed.data.athleteId)
    .eq("status", "active")
    .or(`coach_id.eq.${me},athlete_id.eq.${me}`)
    .maybeSingle();

  if (!rel?.coach_id || !rel.athlete_id) {
    return { ok: false, error: "No hay un hilo activo con esta persona." };
  }

  const { error } = await supabase.from("messages").insert({
    coach_id: rel.coach_id,
    athlete_id: rel.athlete_id,
    sender_id: me,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: "No se pudo enviar el mensaje." };

  revalidatePath("/coach");
  revalidatePath("/mensajes");
  revalidatePath(`/mensajes/${rel.athlete_id}`);
  return { ok: true };
}

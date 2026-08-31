import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Exercise = Database["public"]["Tables"]["exercise_library"]["Row"];

/** Ejercicios de la biblioteca del coach actual, por nombre. */
export async function listExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("exercise_library").select("*").eq("id", id).maybeSingle();
  return data;
}

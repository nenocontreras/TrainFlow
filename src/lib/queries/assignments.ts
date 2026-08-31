import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];
export type Assignment = Tables["plan_assignments"]["Row"];

export type AssignmentWithPlan = Assignment & {
  plan: Pick<Tables["training_plans"]["Row"], "id" | "name" | "archived"> | null;
  sessionsCount: number;
};

/** Asignaciones de un atleta (planes que le ha puesto el coach actual). */
export async function listAssignmentsForAthlete(athleteId: string): Promise<AssignmentWithPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_assignments")
    .select("*, plan:training_plans(id, name, archived), workout_sessions(count)")
    .eq("athlete_id", athleteId)
    .order("active", { ascending: false })
    .order("start_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { plan, workout_sessions, ...assignment } = row as Assignment & {
      plan: AssignmentWithPlan["plan"];
      workout_sessions: { count: number }[];
    };
    return { ...assignment, plan, sessionsCount: workout_sessions?.[0]?.count ?? 0 };
  });
}

/** Planes del coach que todavía no tiene asignados (activos) este atleta. */
export async function assignablePlans(
  athleteId: string,
): Promise<Array<Pick<Tables["training_plans"]["Row"], "id" | "name">>> {
  const supabase = await createClient();

  const [{ data: plans }, { data: active }] = await Promise.all([
    supabase
      .from("training_plans")
      .select("id, name")
      .eq("archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("plan_assignments")
      .select("plan_id")
      .eq("athlete_id", athleteId)
      .eq("active", true),
  ]);

  const taken = new Set((active ?? []).map((a) => a.plan_id));
  return (plans ?? []).filter((p) => !taken.has(p.id));
}

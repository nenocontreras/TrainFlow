import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];
export type Plan = Tables["training_plans"]["Row"];

export type PlanExerciseDetail = Tables["plan_exercises"]["Row"] & {
  exercise: Pick<Tables["exercise_library"]["Row"], "id" | "name" | "muscle_group"> | null;
};
export type PlanDayDetail = Tables["plan_days"]["Row"] & {
  exercises: PlanExerciseDetail[];
};
export type PlanDetail = Plan & {
  days: PlanDayDetail[];
  assignmentsCount: number;
};

/** Planes del coach actual (no archivados primero), por fecha de creación desc. */
export async function listPlans(): Promise<Array<Plan & { daysCount: number }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("*, plan_days(count)")
    .order("archived", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => {
    const { plan_days, ...plan } = p as Plan & { plan_days: { count: number }[] };
    return { ...plan, daysCount: plan_days?.[0]?.count ?? 0 };
  });
}

/** Plan con sus días y ejercicios anidados y ordenados. `null` si no existe / sin acceso. */
export async function getPlanDetail(planId: string): Promise<PlanDetail | null> {
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return null;

  const { data: days, error } = await supabase
    .from("plan_days")
    .select("*, plan_exercises(*, exercise:exercise_library(id, name, muscle_group))")
    .eq("plan_id", planId)
    .order("day_order", { ascending: true });
  if (error) throw error;

  const { count } = await supabase
    .from("plan_assignments")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  const shapedDays: PlanDayDetail[] = (days ?? []).map((d) => {
    const { plan_exercises, ...day } = d as PlanDayDetail & {
      plan_exercises: PlanExerciseDetail[];
    };
    const exercises = [...(plan_exercises ?? [])].sort(
      (a, b) => a.exercise_order - b.exercise_order,
    );
    return { ...day, exercises };
  });

  return { ...plan, days: shapedDays, assignmentsCount: count ?? 0 };
}

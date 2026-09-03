import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { computeHomeStats, type HomeStats, type StatSession } from "@/lib/home-stats";

type Tables = Database["public"]["Tables"];

export type SessionSummary = {
  id: string;
  performedAt: string | null;
  athleteNote: string | null;
  dayLabel: string | null;
  setsDone: number;
  setsTotal: number;
};

/** `select` compartido por el historial del atleta y la ficha del coach. */
export const SESSION_SUMMARY_SELECT =
  "id, performed_at, athlete_note, plan_days(label), session_sets(completed)";

type SessionSummaryRow = {
  id: string;
  performed_at: string | null;
  athlete_note: string | null;
  plan_days: Pick<Tables["plan_days"]["Row"], "label"> | null;
  session_sets: { completed: boolean | null }[];
};

export function toSessionSummary(row: unknown): SessionSummary {
  const r = row as SessionSummaryRow;
  const sets = r.session_sets ?? [];
  return {
    id: r.id,
    performedAt: r.performed_at,
    athleteNote: r.athlete_note,
    dayLabel: r.plan_days?.label ?? null,
    setsDone: sets.filter((s) => s.completed).length,
    setsTotal: sets.length,
  };
}

/** Sesiones pasadas del atleta actual, de más reciente a más antigua. */
export async function listMySessions(): Promise<SessionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SUMMARY_SELECT)
    .order("performed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toSessionSummary);
}

type HomeStatsRow = {
  performed_at: string | null;
  plan_days: Pick<Tables["plan_days"]["Row"], "label"> | null;
  session_sets: {
    actual_reps: number | null;
    actual_weight_kg: number | null;
    completed: boolean | null;
    exercise_id: string | null;
  }[];
};

/** Métricas de la tarjeta de inicio del atleta (racha, volumen 7d, PRs, semana). */
export async function getAthleteHomeStats(): Promise<HomeStats> {
  const supabase = await createClient();

  const [{ data: rows }, { data: assignment }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select(
        "performed_at, plan_days(label), session_sets(actual_reps, actual_weight_kg, completed, exercise_id)",
      )
      .order("performed_at", { ascending: false }),
    supabase
      .from("plan_assignments")
      .select("start_date")
      .eq("active", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const sessions: StatSession[] = ((rows ?? []) as HomeStatsRow[]).map((r) => ({
    performedAt: r.performed_at,
    dayLabel: r.plan_days?.label ?? null,
    sets: (r.session_sets ?? []).map((s) => ({
      actualReps: s.actual_reps,
      actualWeightKg: s.actual_weight_kg,
      completed: s.completed,
      exerciseId: s.exercise_id,
    })),
  }));

  return computeHomeStats(sessions, new Date().toISOString(), assignment?.start_date ?? null);
}

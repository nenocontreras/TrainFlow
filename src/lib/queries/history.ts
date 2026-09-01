import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

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

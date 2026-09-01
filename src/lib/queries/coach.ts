import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  adherenceStats,
  buildLoadSeries,
  type AdherenceStats,
  type LoadPoint,
} from "@/lib/progress";
import { listAthletes, type AthleteProfile } from "@/lib/queries/athletes";
import {
  SESSION_SUMMARY_SELECT,
  toSessionSummary,
  type SessionSummary,
} from "@/lib/queries/history";

export type AthleteActivity = {
  athlete: AthleteProfile;
  stats: AdherenceStats;
};

/**
 * Atletas activos del coach con su resumen de adherencia (recencia, ritmo, % de
 * series). El coach lee las sesiones de sus atletas por RLS de solo lectura.
 */
export async function listAthletesWithActivity(): Promise<AthleteActivity[]> {
  const athletes = await listAthletes();
  if (athletes.length === 0) return [];

  const supabase = await createClient();
  const ids = athletes.map((a) => a.athlete.id);
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("athlete_id, performed_at, session_sets(completed)")
    .in("athlete_id", ids);
  if (error) throw error;

  const byAthlete = new Map<
    string,
    { performedAt: string | null; sets: { completed: boolean | null }[] }[]
  >();
  for (const row of data ?? []) {
    const r = row as {
      athlete_id: string | null;
      performed_at: string | null;
      session_sets: { completed: boolean | null }[];
    };
    if (!r.athlete_id) continue;
    const list = byAthlete.get(r.athlete_id) ?? [];
    list.push({ performedAt: r.performed_at, sets: r.session_sets ?? [] });
    byAthlete.set(r.athlete_id, list);
  }

  const now = new Date().toISOString();
  return athletes.map((a) => ({
    athlete: a.athlete,
    stats: adherenceStats(byAthlete.get(a.athlete.id) ?? [], now),
  }));
}

/** Últimas sesiones de un atleta del coach (más reciente primero). */
export async function getAthleteRecentSessions(
  athleteId: string,
  limit = 12,
): Promise<SessionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SUMMARY_SELECT)
    .eq("athlete_id", athleteId)
    .order("performed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(toSessionSummary);
}

export type TrackedExercise = { id: string; name: string };

type SessionWithSets = {
  performed_at: string | null;
  session_sets: {
    actual_reps: number | null;
    actual_weight_kg: number | null;
    completed: boolean | null;
    exercise_id: string | null;
  }[];
};

// `exercise_id` es la instantánea de la migración 0010: sobrevive a que el coach
// borre el ejercicio del plan (0009: on delete set null en plan_exercise_id).
const SESSION_SETS_SELECT =
  "performed_at, session_sets(actual_reps, actual_weight_kg, completed, exercise_id)";

/** Ejercicios de biblioteca que el atleta ha registrado con peso, ordenados por nombre. */
export async function listTrackedExercises(athleteId: string): Promise<TrackedExercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SETS_SELECT)
    .eq("athlete_id", athleteId);
  if (error) throw error;

  const exerciseIds = new Set<string>();
  for (const row of (data ?? []) as SessionWithSets[]) {
    for (const s of row.session_sets ?? []) {
      if (s.exercise_id && (s.actual_weight_kg ?? 0) > 0) exerciseIds.add(s.exercise_id);
    }
  }
  if (exerciseIds.size === 0) return [];

  const { data: exercises, error: exError } = await supabase
    .from("exercise_library")
    .select("id, name")
    .in("id", [...exerciseIds])
    .order("name", { ascending: true });
  if (exError) throw exError;
  return exercises ?? [];
}

/** Serie temporal de 1RM estimado del atleta para un ejercicio concreto. */
export async function getExerciseLoadSeries(
  athleteId: string,
  exerciseId: string,
): Promise<LoadPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SETS_SELECT)
    .eq("athlete_id", athleteId)
    .order("performed_at", { ascending: true });
  if (error) throw error;

  const sessions = ((data ?? []) as SessionWithSets[]).map((row) => ({
    performedAt: row.performed_at,
    sets: (row.session_sets ?? [])
      .filter((s) => s.exercise_id === exerciseId)
      .map((s) => ({
        actualReps: s.actual_reps,
        actualWeightKg: s.actual_weight_kg,
        completed: s.completed,
      })),
  }));

  return buildLoadSeries(sessions);
}

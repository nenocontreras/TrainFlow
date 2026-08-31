import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveTodayDay } from "@/lib/today";
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];
export type SessionSet = Tables["session_sets"]["Row"];

export type TodayExercise = Tables["plan_exercises"]["Row"] & {
  exercise: Pick<
    Tables["exercise_library"]["Row"],
    "id" | "name" | "muscle_group" | "video_url"
  > | null;
};
export type TodayDay = Tables["plan_days"]["Row"] & { exercises: TodayExercise[] };

export type TodayView = {
  assignmentId: string;
  planName: string;
  startDate: string;
  started: boolean;
  days: TodayDay[];
  sessionsCompleted: number;
  currentDay: TodayDay | null;
  todaySession: { id: string; athlete_note: string | null; sets: SessionSet[] } | null;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Todo lo que necesita la vista "Hoy" del atleta, o `null` si no tiene plan activo. */
export async function getTodayView(pickedDayId?: string): Promise<TodayView | null> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("plan_assignments")
    .select("id, plan_id, start_date")
    .eq("active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!assignment?.plan_id) return null;
  const planId = assignment.plan_id;

  const [{ data: plan }, { data: rawDays }, { count }, { data: sessionToday }] = await Promise.all([
    supabase.from("training_plans").select("name").eq("id", planId).maybeSingle(),
    supabase
      .from("plan_days")
      .select("*, plan_exercises(*, exercise:exercise_library(id, name, muscle_group, video_url))")
      .eq("plan_id", planId)
      .order("day_order", { ascending: true }),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("plan_assignment_id", assignment.id),
    supabase
      .from("workout_sessions")
      .select("id, athlete_note, plan_day_id, session_sets(*)")
      .eq("plan_assignment_id", assignment.id)
      .gte("performed_at", `${todayISO()}T00:00:00`)
      .order("performed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const days: TodayDay[] = (rawDays ?? []).map((d) => {
    const { plan_exercises, ...day } = d as TodayDay & { plan_exercises: TodayExercise[] };
    const exercises = [...(plan_exercises ?? [])].sort(
      (a, b) => a.exercise_order - b.exercise_order,
    );
    return { ...day, exercises };
  });

  const sessionsCompleted = count ?? 0;

  // Si ya hay sesión hoy, el día es el de esa sesión; si no, la rotación / el elegido.
  const activeDayId = sessionToday?.plan_day_id ?? pickedDayId;
  const currentDay = resolveTodayDay(days, sessionsCompleted, activeDayId);

  const todaySession = sessionToday
    ? {
        id: sessionToday.id,
        athlete_note: sessionToday.athlete_note,
        sets: [...((sessionToday.session_sets as SessionSet[]) ?? [])].sort(
          (a, b) => a.set_number - b.set_number,
        ),
      }
    : null;

  return {
    assignmentId: assignment.id,
    planName: plan?.name ?? "Plan",
    startDate: assignment.start_date,
    started: assignment.start_date <= todayISO(),
    days,
    sessionsCompleted,
    currentDay,
    todaySession,
  };
}

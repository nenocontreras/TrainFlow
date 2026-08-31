"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { logSetAction, startSessionAction } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { SetRow, type SetPatch } from "./set-row";
import { FinishSession } from "./finish-session";
import type { SessionSet, TodayView as TodayViewData } from "@/lib/queries/today";

export function TodayView({ data }: { data: TodayViewData }) {
  const router = useRouter();
  const [pickedDayId, setPickedDayId] = useState<string | null>(data.currentDay?.id ?? null);
  const [starting, startStartTransition] = useTransition();

  const day =
    data.days.find((d) => d.id === pickedDayId) ?? data.currentDay ?? data.days[0] ?? null;

  if (!data.started) {
    return (
      <Empty
        title="Tu plan aún no empieza"
        body={`“${data.planName}” arranca el ${data.startDate}.`}
      />
    );
  }
  if (!day) {
    return <Empty title="El plan no tiene días" body="Pídele a tu coach que lo complete." />;
  }

  // --- Sesión en curso: registro de series --------------------------------
  if (data.todaySession) {
    return (
      <LoggingView
        planName={data.planName}
        dayLabel={day.label}
        day={day}
        session={data.todaySession}
        onAfterMutate={() => router.refresh()}
      />
    );
  }

  // --- Sin sesión hoy: elegir día y empezar -------------------------------
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-muted-foreground text-sm">{data.planName}</p>
        <h1 className="text-2xl">Hoy te toca</h1>
      </header>

      {data.days.length > 1 ? (
        <select
          value={day.id}
          onChange={(e) => setPickedDayId(e.target.value)}
          aria-label="Elegir día"
          className="border-input bg-background h-9 w-full max-w-xs rounded-md border px-2 text-sm"
        >
          {data.days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      ) : null}

      <section className="bg-card rounded-lg border p-4">
        <h2 className="font-display text-lg font-bold">{day.label}</h2>
        <ul className="text-muted-foreground mt-2 flex flex-col gap-1 text-sm">
          {day.exercises.map((ex) => (
            <li key={ex.id} className="tabular-nums">
              {ex.exercise?.name ?? "Ejercicio"} — {ex.target_sets} × {ex.target_reps}
            </li>
          ))}
          {day.exercises.length === 0 ? <li>Este día no tiene ejercicios.</li> : null}
        </ul>
      </section>

      <form
        action={(fd) =>
          startStartTransition(async () => {
            const res = await startSessionAction({}, fd);
            if (res.error) toast.error(res.error);
            else router.refresh();
          })
        }
      >
        <input type="hidden" name="planAssignmentId" value={data.assignmentId} />
        <input type="hidden" name="planDayId" value={day.id} />
        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={starting || day.exercises.length === 0}
        >
          {starting ? "Preparando…" : `Empezar ${day.label}`}
        </Button>
      </form>
    </div>
  );
}

function LoggingView({
  planName,
  dayLabel,
  day,
  session,
  onAfterMutate,
}: {
  planName: string;
  dayLabel: string;
  day: TodayViewData["days"][number];
  session: NonNullable<TodayViewData["todaySession"]>;
  onAfterMutate: () => void;
}) {
  const [, startMutation] = useTransition();
  const [optimisticSets, applyOptimistic] = useOptimistic(
    session.sets,
    (state: SessionSet[], patch: SetPatch) =>
      state.map((s) =>
        s.id === patch.id
          ? {
              ...s,
              actual_reps: patch.actualReps ?? s.actual_reps,
              actual_weight_kg: patch.actualWeightKg ?? s.actual_weight_kg,
              completed: patch.completed ?? s.completed,
            }
          : s,
      ),
  );

  function patchSet(patch: SetPatch) {
    const set = optimisticSets.find((s) => s.id === patch.id);
    if (!set) return;
    startMutation(async () => {
      applyOptimistic(patch);
      const res = await logSetAction({
        setId: patch.id,
        actualReps: patch.actualReps ?? set.actual_reps ?? "",
        actualWeightKg: patch.actualWeightKg ?? set.actual_weight_kg ?? "",
        completed: patch.completed ?? set.completed ?? false,
      });
      if (!res.ok) toast.error(res.error ?? "No se pudo guardar");
      else onAfterMutate();
    });
  }

  const done = optimisticSets.filter((s) => s.completed).length;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-muted-foreground text-sm">{planName}</p>
        <h1 className="text-2xl">{dayLabel}</h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {done} / {optimisticSets.length} series
        </p>
      </header>

      {day.exercises.map((ex) => {
        const sets = optimisticSets.filter((s) => s.plan_exercise_id === ex.id);
        return (
          <section key={ex.id} className="bg-card flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{ex.exercise?.name ?? "Ejercicio"}</h2>
              {ex.exercise?.video_url ? (
                <a
                  href={ex.exercise.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground text-xs underline"
                >
                  vídeo
                </a>
              ) : null}
            </div>
            {ex.coach_notes ? (
              <p className="text-muted-foreground text-xs">{ex.coach_notes}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              {sets.map((s) => (
                <SetRow key={s.id} set={s} targetReps={ex.target_reps} onPatch={patchSet} />
              ))}
            </div>
          </section>
        );
      })}

      <FinishSession sessionId={session.id} defaultNote={session.athlete_note ?? ""} />
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <CalendarClock className="text-muted-foreground size-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      </div>
    </div>
  );
}

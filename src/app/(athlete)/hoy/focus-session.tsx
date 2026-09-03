"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { logSetAction } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionSet, TodayDay } from "@/lib/queries/today";
import { RestOverlay } from "./rest-overlay";
import { DEFAULT_REST_SECONDS, useRestTimer } from "./use-rest-timer";
import { FinishSession } from "./finish-session";

/** Primer número del `target_reps` del plan ("5", "8-10", "45 s") como valor inicial. */
function parseTargetReps(target: string): number {
  const m = target.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

type Patch = { id: string; actualReps?: number; actualWeightKg?: number; completed?: boolean };

/**
 * Sesión en curso, modelo "enfoque" (opción 1b): un ejercicio a la vez, cifras
 * grandes y una sola acción primaria. Sustituye a `LoggingView` de `today-view`.
 */
export function FocusSession({
  planName,
  day,
  session,
  onAfterMutate,
}: {
  planName: string;
  day: TodayDay;
  session: { id: string; athlete_note: string | null; sets: SessionSet[] };
  onAfterMutate: () => void;
}) {
  const [exIdx, setExIdx] = useState(0);
  const [, startMutation] = useTransition();
  const rest = useRestTimer(DEFAULT_REST_SECONDS);

  const [sets, applyOptimistic] = useOptimistic(session.sets, (state: SessionSet[], patch: Patch) =>
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

  const exercises = day.exercises;
  const exercise = exercises[exIdx] ?? exercises[0];
  const exSets = useMemo(
    () =>
      sets
        .filter((s) => s.plan_exercise_id === exercise?.id)
        .sort((a, b) => a.set_number - b.set_number),
    [sets, exercise?.id],
  );

  const current = exSets.find((s) => !s.completed) ?? exSets[exSets.length - 1];
  const lastLogged = [...exSets].reverse().find((s) => s.actual_weight_kg !== null);
  const doneAll = sets.filter((s) => s.completed).length;

  // Peso/reps mostrados: lo ya registrado en esta serie, si no la última serie
  // registrada del mismo ejercicio, si no el objetivo del plan.
  const weight = current?.actual_weight_kg ?? lastLogged?.actual_weight_kg ?? 0;
  const reps =
    current?.actual_reps ?? lastLogged?.actual_reps ?? parseTargetReps(exercise?.target_reps ?? "");

  if (!exercise || !current) return null;

  function patch(next: Patch) {
    const base = sets.find((s) => s.id === next.id);
    if (!base) return;
    startMutation(async () => {
      applyOptimistic(next);
      const res = await logSetAction({
        setId: next.id,
        actualReps: next.actualReps ?? base.actual_reps ?? "",
        actualWeightKg: next.actualWeightKg ?? base.actual_weight_kg ?? "",
        completed: next.completed ?? base.completed ?? false,
      });
      if (!res.ok) toast.error(res.error ?? "No se pudo guardar");
      else onAfterMutate();
    });
  }

  function register() {
    if (!current) return;
    patch({ id: current.id, actualWeightKg: weight, actualReps: reps, completed: true });
    rest.start();
  }

  function undo() {
    const last = [...exSets].reverse().find((s) => s.completed);
    if (!last) return;
    patch({ id: last.id, completed: false });
    rest.skip();
  }

  const nextSet = exSets.find((s) => !s.completed && s.id !== current.id) ?? current;

  return (
    <div className="relative flex min-h-[calc(100dvh-8rem)] flex-col">
      {/* Cabecera: navegación entre ejercicios */}
      <header className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Ejercicio anterior"
          onClick={() => setExIdx((i) => (i + exercises.length - 1) % exercises.length)}
        >
          ←
        </Button>
        <div className="text-center">
          <p className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.12em] uppercase">
            Ejercicio {exIdx + 1} de {exercises.length}
          </p>
          <p className="text-primary mt-1 font-mono text-xs font-semibold tabular-nums">
            {doneAll}/{sets.length} series · {planName}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Ejercicio siguiente"
          onClick={() => setExIdx((i) => (i + 1) % exercises.length)}
        >
          →
        </Button>
      </header>

      <h1 className="mt-6 text-3xl leading-none">{exercise.exercise?.name ?? "Ejercicio"}</h1>
      <p className="text-muted-foreground mt-2 font-mono text-[0.65rem] tracking-[0.08em] uppercase">
        Objetivo {exercise.target_sets} × {exercise.target_reps}
        {lastLogged?.actual_weight_kg
          ? ` · última ${lastLogged.actual_weight_kg} kg × ${lastLogged.actual_reps ?? "—"}`
          : ""}
      </p>

      {/* Progreso de series del ejercicio */}
      <div className="mt-5 flex gap-1.5" aria-hidden>
        {exSets.map((s) => (
          <span
            key={s.id}
            className={cn("h-1.5 flex-1 rounded-full", s.completed ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      {/* Cifras */}
      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="text-primary font-mono text-[0.65rem] tracking-[0.12em] uppercase">
          Serie {current.set_number} de {exSets.length}
        </p>
        <div className="mt-3 flex items-end gap-5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[4.75rem] leading-[0.85] tracking-tight tabular-nums">
                {weight}
              </span>
              <span className="text-muted-foreground font-display text-xl">kg</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                className="h-11 w-15 font-mono text-[0.8rem]"
                onClick={() => patch({ id: current.id, actualWeightKg: Math.max(0, weight - 2.5) })}
              >
                −2.5
              </Button>
              <Button
                variant="outline"
                className="h-11 w-15 font-mono text-[0.8rem]"
                onClick={() => patch({ id: current.id, actualWeightKg: weight + 2.5 })}
              >
                +2.5
              </Button>
            </div>
          </div>

          <div className="border-border border-l pl-5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-5xl leading-[0.9] tracking-tight tabular-nums">
                {reps}
              </span>
              <span className="text-muted-foreground font-display text-base">reps</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                className="h-11 w-12 text-base"
                aria-label="Menos repeticiones"
                onClick={() => patch({ id: current.id, actualReps: Math.max(0, reps - 1) })}
              >
                −
              </Button>
              <Button
                variant="outline"
                className="h-11 w-12 text-base"
                aria-label="Más repeticiones"
                onClick={() => patch({ id: current.id, actualReps: reps + 1 })}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {exercise.coach_notes ? (
          <p className="text-muted-foreground border-chart-3 mt-6 border-l-2 pl-3 text-sm">
            {exercise.coach_notes}
          </p>
        ) : null}
      </div>

      {/* Acción primaria */}
      <div className="flex flex-col gap-2.5">
        <Button className="font-display h-18 rounded-2xl text-xl" onClick={register}>
          Serie hecha ✓
        </Button>
        <Button variant="ghost" className="text-muted-foreground h-10 text-[0.8rem]" onClick={undo}>
          Deshacer última serie
        </Button>
        <FinishSession sessionId={session.id} defaultNote={session.athlete_note ?? ""} />
      </div>

      {rest.running ? (
        <RestOverlay
          left={rest.left}
          total={rest.total}
          elapsed={rest.elapsed}
          nextLabel={`Serie ${nextSet.set_number} · ${weight} kg × ${reps}`}
          onAdd={() => rest.add(30)}
          onSkip={rest.skip}
        />
      ) : null}
    </div>
  );
}

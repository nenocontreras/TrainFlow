"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  addPlanExerciseAction,
  updatePlanExerciseAction,
  type ActionState,
} from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/field-error";
import type { Exercise } from "@/lib/queries/exercises";
import type { PlanDayDetail, PlanExerciseDetail } from "@/lib/queries/plans";

const initial: ActionState = {};

export function PlanExerciseForm({
  planId,
  days,
  currentDayId,
  library,
  presetExerciseId,
  existing,
  onDone,
}: {
  planId: string;
  days: Pick<PlanDayDetail, "id" | "label">[];
  currentDayId: string;
  library: Exercise[];
  presetExerciseId?: string;
  existing?: PlanExerciseDetail;
  onDone: () => void;
}) {
  const isEdit = Boolean(existing);
  const [state, formAction, pending] = useActionState(
    isEdit ? updatePlanExerciseAction : addPlanExerciseAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(isEdit ? "Ejercicio actualizado" : "Ejercicio añadido");
      onDone();
    }
  }, [state.ok, isEdit, onDone]);

  const showDayPicker = !isEdit && days.length > 1;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="planId" value={planId} />
      {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
      {showDayPicker ? null : <input type="hidden" name="dayId" value={currentDayId} />}

      {state.error ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}

      {showDayPicker ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="dayId">Día</Label>
          <select
            id="dayId"
            name="dayId"
            defaultValue={currentDayId}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          >
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="exerciseId">Ejercicio</Label>
        <Select
          name="exerciseId"
          defaultValue={existing?.exercise_id ?? presetExerciseId ?? undefined}
        >
          <SelectTrigger id="exerciseId">
            <SelectValue placeholder="Elige de tu biblioteca" />
          </SelectTrigger>
          <SelectContent>
            {library.map((ex) => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.name}
                {ex.muscle_group ? ` · ${ex.muscle_group}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={state.fieldErrors?.exerciseId} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetSets">Series</Label>
          <Input
            id="targetSets"
            name="targetSets"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            defaultValue={existing?.target_sets ?? 3}
            required
          />
          <FieldError messages={state.fieldErrors?.targetSets} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetReps">Repeticiones</Label>
          <Input
            id="targetReps"
            name="targetReps"
            defaultValue={existing?.target_reps ?? ""}
            placeholder="8-10, AMRAP…"
            required
          />
          <FieldError messages={state.fieldErrors?.targetReps} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="targetRestSeconds">Descanso (segundos)</Label>
        <Input
          id="targetRestSeconds"
          name="targetRestSeconds"
          type="number"
          inputMode="numeric"
          min={0}
          max={3600}
          defaultValue={existing?.target_rest_seconds ?? ""}
          className="w-32"
        />
        <FieldError messages={state.fieldErrors?.targetRestSeconds} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="coachNotes">Nota técnica</Label>
        <Textarea
          id="coachNotes"
          name="coachNotes"
          defaultValue={existing?.coach_notes ?? ""}
          rows={2}
          placeholder="RPE 8, progresión +2.5kg…"
        />
        <FieldError messages={state.fieldErrors?.coachNotes} />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar" : "Añadir"}
        </Button>
      </div>
    </form>
  );
}

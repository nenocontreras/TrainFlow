"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  createExerciseAction,
  updateExerciseAction,
  type ActionState,
} from "@/lib/actions/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/field-error";
import type { Exercise } from "@/lib/queries/exercises";

const initial: ActionState = {};

export function ExerciseForm({ exercise, onDone }: { exercise?: Exercise; onDone: () => void }) {
  const isEdit = Boolean(exercise);
  const action = isEdit ? updateExerciseAction : createExerciseAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success(isEdit ? "Ejercicio actualizado" : "Ejercicio creado");
      onDone();
    }
  }, [state.ok, isEdit, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {exercise ? <input type="hidden" name="id" value={exercise.id} /> : null}
      {state.error ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={exercise?.name ?? ""} required autoFocus />
        <FieldError messages={state.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="muscleGroup">Grupo muscular</Label>
        <Input
          id="muscleGroup"
          name="muscleGroup"
          defaultValue={exercise?.muscle_group ?? ""}
          placeholder="Pecho, Pierna, Espalda…"
        />
        <FieldError messages={state.fieldErrors?.muscleGroup} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="instructions">Instrucciones técnicas</Label>
        <Textarea
          id="instructions"
          name="instructions"
          defaultValue={exercise?.instructions ?? ""}
          rows={4}
        />
        <FieldError messages={state.fieldErrors?.instructions} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="videoUrl">Vídeo (URL)</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          type="url"
          inputMode="url"
          defaultValue={exercise?.video_url ?? ""}
          placeholder="https://…"
        />
        <FieldError messages={state.fieldErrors?.videoUrl} />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

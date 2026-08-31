"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createPlanAction, updatePlanAction, type ActionState } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/field-error";
import type { Plan } from "@/lib/queries/plans";

const initial: ActionState = {};

export function PlanForm({ plan, onDone }: { plan?: Plan; onDone?: () => void }) {
  const isEdit = Boolean(plan);
  const [state, formAction, pending] = useActionState(
    isEdit ? updatePlanAction : createPlanAction,
    initial,
  );

  useEffect(() => {
    if (state.ok && isEdit) {
      toast.success("Plan actualizado");
      onDone?.();
    }
  }, [state.ok, isEdit, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {plan ? <input type="hidden" name="planId" value={plan.id} /> : null}
      {state.error ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre del plan</Label>
        <Input
          id="name"
          name="name"
          defaultValue={plan?.name ?? ""}
          placeholder="Full Body 3x semana"
          required
          autoFocus={!isEdit}
        />
        <FieldError messages={state.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={plan?.description ?? ""}
          rows={3}
        />
        <FieldError messages={state.fieldErrors?.description} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="durationWeeks">Duración (semanas)</Label>
        <Input
          id="durationWeeks"
          name="durationWeeks"
          type="number"
          inputMode="numeric"
          min={1}
          max={52}
          defaultValue={plan?.duration_weeks ?? ""}
          className="w-28"
        />
        <FieldError messages={state.fieldErrors?.durationWeeks} />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar" : "Crear plan"}
        </Button>
      </div>
    </form>
  );
}

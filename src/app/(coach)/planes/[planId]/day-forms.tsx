"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { addDayAction, renameDayAction, type ActionState } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/field-error";

const initial: ActionState = {};

export function AddDayForm({ planId }: { planId: string }) {
  const [state, formAction, pending] = useActionState(addDayAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name="planId" value={planId} />
        <Input name="label" placeholder="Día 1 — Empuje" aria-label="Nombre del día" required />
        <Button type="submit" disabled={pending}>
          {pending ? "…" : "Añadir día"}
        </Button>
      </div>
      <FieldError messages={state.fieldErrors?.label} />
    </form>
  );
}

export function RenameDayForm({
  planId,
  dayId,
  currentLabel,
  onDone,
}: {
  planId: string;
  dayId: string;
  currentLabel: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(renameDayAction, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success("Día renombrado");
      onDone();
    }
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="dayId" value={dayId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="rename-label">Nombre</Label>
        <Input id="rename-label" name="label" defaultValue={currentLabel} required autoFocus />
        <FieldError messages={state.fieldErrors?.label} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

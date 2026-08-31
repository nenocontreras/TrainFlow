"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { assignPlanAction, type ActionState } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthMessage } from "@/components/auth-message";
import { FieldError } from "@/components/field-error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initial: ActionState = {};

export function AssignPlanDialog({
  athleteId,
  plans,
}: {
  athleteId: string;
  plans: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(assignPlanAction, initial);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.ok) {
      toast.success("Plan asignado");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={plans.length === 0}>
          <Plus className="size-4" /> Asignar plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar un plan</DialogTitle>
        </DialogHeader>
        {plans.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este atleta ya tiene asignados todos tus planes activos.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="athleteId" value={athleteId} />
            {state.error ? <AuthMessage variant="error">{state.error}</AuthMessage> : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="planId">Plan</Label>
              <select
                id="planId"
                name="planId"
                required
                defaultValue=""
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              >
                <option value="" disabled>
                  Elige un plan
                </option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <FieldError messages={state.fieldErrors?.planId} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={today}
                required
                className="w-44"
              />
              <FieldError messages={state.fieldErrors?.startDate} />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Asignando…" : "Asignar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

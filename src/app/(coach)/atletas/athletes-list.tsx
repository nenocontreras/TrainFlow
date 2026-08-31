"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ChevronRight, Mail, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { linkAthleteAction, type ActionState } from "@/lib/actions/athletes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IconInput } from "@/components/icon-input";
import { AuthMessage } from "@/components/auth-message";
import { FieldError } from "@/components/field-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CoachAthlete } from "@/lib/queries/athletes";

const initial: ActionState = {};

export function AthletesList({ athletes }: { athletes: CoachAthlete[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(linkAthleteAction, initial);

  useEffect(() => {
    if (state.ok) {
      toast.success("Atleta vinculado");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Atletas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Añadir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir atleta</DialogTitle>
              <DialogDescription>
                El atleta debe haberse registrado ya en TrainFlow con su email.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              {state.error ? <AuthMessage variant="error">{state.error}</AuthMessage> : null}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email del atleta</Label>
                <IconInput
                  icon={Mail}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="amigo@correo.com"
                  required
                  autoFocus
                />
                <FieldError messages={state.fieldErrors?.email} />
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
                  <UserPlus className="size-4" />
                  {pending ? "Vinculando…" : "Vincular"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {athletes.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Aún no tienes atletas. Añade a uno por su email.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
          {athletes.map(({ athlete }) => (
            <li key={athlete.id}>
              <Link
                href={`/atletas/${athlete.id}`}
                className="bg-card hover:border-primary/50 flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors"
              >
                <span className="font-medium">{athlete.full_name}</span>
                <ChevronRight className="text-muted-foreground size-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

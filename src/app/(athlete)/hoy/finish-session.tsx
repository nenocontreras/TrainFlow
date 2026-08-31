"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  discardSessionAction,
  finishSessionAction,
  type ActionState,
} from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const initial: ActionState = {};

export function FinishSession({
  sessionId,
  defaultNote,
}: {
  sessionId: string;
  defaultNote: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(finishSessionAction, initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      toast.success("Sesión guardada");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <section className="bg-card flex flex-col gap-3 rounded-lg border p-3">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="sessionId" value={sessionId} />
        <Label htmlFor="athleteNote">Nota (opcional)</Label>
        <Textarea
          id="athleteNote"
          name="athleteNote"
          defaultValue={defaultNote}
          rows={2}
          placeholder="Hoy me costó la última serie de sentadilla…"
        />
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? "Guardando…" : saved ? "Guardar cambios" : "Terminar entrenamiento"}
        </Button>
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive self-start">
            Descartar sesión
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar la sesión de hoy</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran las series registradas hoy. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <form action={discardSessionAction}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <AlertDialogAction type="submit">Descartar</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

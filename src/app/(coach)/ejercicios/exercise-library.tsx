"use client";

import { useActionState, useEffect, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { deleteExerciseAction, type ActionState } from "@/lib/actions/exercises";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ExerciseForm } from "./exercise-form";
import type { Exercise } from "@/lib/queries/exercises";

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Ejercicios</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo ejercicio</DialogTitle>
            </DialogHeader>
            <ExerciseForm onDone={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {exercises.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Aún no tienes ejercicios. Crea el primero para usarlo en tus planes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <li
              key={ex.id}
              className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{ex.name}</span>
                  {ex.muscle_group ? <Badge variant="secondary">{ex.muscle_group}</Badge> : null}
                  {ex.video_url ? (
                    <a
                      href={ex.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground inline-flex items-center gap-1 text-xs underline"
                    >
                      <Video className="size-3" /> vídeo
                    </a>
                  ) : null}
                </div>
                {ex.instructions ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {ex.instructions}
                  </p>
                ) : null}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Acciones de ${ex.name}`}>
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(ex)}>
                    <Pencil className="size-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(ex)}>
                    <Trash2 className="size-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ejercicio</DialogTitle>
          </DialogHeader>
          {editing ? <ExerciseForm exercise={editing} onDone={() => setEditing(null)} /> : null}
        </DialogContent>
      </Dialog>

      <DeleteExerciseDialog exercise={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function DeleteExerciseDialog({
  exercise,
  onClose,
}: {
  exercise: Exercise | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteExerciseAction, {} as ActionState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Ejercicio eliminado");
      onClose();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onClose]);

  return (
    <AlertDialog open={Boolean(exercise)} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar “{exercise?.name}”</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Si el ejercicio está en algún plan, no podrás
            eliminarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={exercise?.id ?? ""} />
            <AlertDialogAction type="submit" disabled={pending}>
              {pending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

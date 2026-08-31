"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { deleteExerciseAction, type ActionState } from "@/lib/actions/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const ALL = "__all__";

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string>(ALL);
  const [equip, setEquip] = useState<string>(ALL);

  const muscleGroups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscle_group).filter((v): v is string => !!v))].sort(),
    [exercises],
  );
  const equipments = useMemo(
    () => [...new Set(exercises.map((e) => e.equipment).filter((v): v is string => !!v))].sort(),
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (!q || e.name.toLowerCase().includes(q)) &&
        (muscle === ALL || e.muscle_group === muscle) &&
        (equip === ALL || e.equipment === equip),
    );
  }, [exercises, query, muscle, equip]);

  const mine = filtered.filter((e) => e.coach_id !== null);
  const base = filtered.filter((e) => e.coach_id === null);

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
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo ejercicio</DialogTitle>
            </DialogHeader>
            <ExerciseForm onDone={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="max-w-[12rem]"
        />
        <FilterSelect
          value={muscle}
          onChange={setMuscle}
          allLabel="Grupo muscular"
          options={muscleGroups}
        />
        <FilterSelect
          value={equip}
          onChange={setEquip}
          allLabel="Equipamiento"
          options={equipments}
        />
      </div>

      {mine.length > 0 ? (
        <Group title="Mis ejercicios">
          {mine.map((ex) => (
            <ExerciseRow
              key={ex.id}
              ex={ex}
              onEdit={() => setEditing(ex)}
              onDelete={() => setDeleting(ex)}
            />
          ))}
        </Group>
      ) : null}

      <Group title={`Biblioteca base (${base.length})`}>
        {base.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nada coincide con el filtro.</p>
        ) : (
          base.map((ex) => <ExerciseRow key={ex.id} ex={ex} />)
        )}
      </Group>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2">{children}</ul>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-input bg-background h-9 rounded-md border px-2 text-sm"
      aria-label={allLabel}
    >
      <option value={ALL}>{allLabel}: todos</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ExerciseRow({
  ex,
  onEdit,
  onDelete,
}: {
  ex: Exercise;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isSystem = ex.coach_id === null;
  return (
    <li className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{ex.name}</span>
          {isSystem ? <Badge variant="outline">Base</Badge> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ex.muscle_group ? <Badge variant="secondary">{ex.muscle_group}</Badge> : null}
          {ex.equipment ? <Badge variant="secondary">{ex.equipment}</Badge> : null}
          {ex.movement_pattern ? <Badge variant="secondary">{ex.movement_pattern}</Badge> : null}
          {ex.tempo ? <Badge variant="secondary">Tempo {ex.tempo}</Badge> : null}
        </div>
        {ex.instructions ? (
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">{ex.instructions}</p>
        ) : null}
        {ex.video_url ? (
          <a
            href={ex.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground mt-1.5 inline-flex items-center gap-1 text-xs underline"
          >
            <Video className="size-3" /> ver vídeo
          </a>
        ) : null}
      </div>

      {onEdit && onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Acciones de ${ex.name}`}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="size-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="size-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
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

"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteDayAction,
  moveDayAction,
  movePlanExerciseAction,
  removePlanExerciseAction,
} from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlanExerciseForm } from "./plan-exercise-form";
import { RenameDayForm } from "./day-forms";
import type { Exercise } from "@/lib/queries/exercises";
import type { PlanDayDetail, PlanExerciseDetail } from "@/lib/queries/plans";

function HiddenIds(props: Record<string, string>) {
  return (
    <>
      {Object.entries(props).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export function DayCard({
  planId,
  day,
  library,
  isFirst,
  isLast,
}: {
  planId: string;
  day: PlanDayDetail;
  library: Exercise[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PlanExerciseDetail | null>(null);

  return (
    <section className="bg-card rounded-lg border">
      <header className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold">Día {day.day_order}</span>
          <h3 className="text-base font-semibold">{day.label}</h3>
        </div>
        <div className="flex items-center">
          <form action={moveDayAction}>
            <HiddenIds planId={planId} dayId={day.id} direction="up" />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={isFirst}
              aria-label="Subir día"
            >
              <ArrowUp className="size-4" />
            </Button>
          </form>
          <form action={moveDayAction}>
            <HiddenIds planId={planId} dayId={day.id} direction="down" />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={isLast}
              aria-label="Bajar día"
            >
              <ArrowDown className="size-4" />
            </Button>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Acciones del día ${day.label}`}>
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <Pencil className="size-4" /> Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  const form = document.getElementById(
                    `del-day-${day.id}`,
                  ) as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
              >
                <Trash2 className="size-4" /> Eliminar día
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <form id={`del-day-${day.id}`} action={deleteDayAction} className="hidden">
            <HiddenIds planId={planId} dayId={day.id} />
          </form>
        </div>
      </header>

      <div className="flex flex-col gap-2 p-3">
        {day.exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin ejercicios todavía.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {day.exercises.map((pe, i) => (
              <li
                key={pe.id}
                className="bg-background flex items-start justify-between gap-2 rounded-md border p-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">{pe.exercise?.name ?? "Ejercicio eliminado"}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {pe.target_sets} × {pe.target_reps}
                    {pe.target_rest_seconds ? ` · ${pe.target_rest_seconds}s descanso` : ""}
                  </p>
                  {pe.coach_notes ? (
                    <p className="text-muted-foreground mt-0.5 text-xs">{pe.coach_notes}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <form action={movePlanExerciseAction}>
                    <HiddenIds planId={planId} dayId={day.id} id={pe.id} direction="up" />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      disabled={i === 0}
                      aria-label="Subir ejercicio"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                  </form>
                  <form action={movePlanExerciseAction}>
                    <HiddenIds planId={planId} dayId={day.id} id={pe.id} direction="down" />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      disabled={i === day.exercises.length - 1}
                      aria-label="Bajar ejercicio"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </form>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar ejercicio"
                    onClick={() => setEditing(pe)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <form action={removePlanExerciseAction}>
                    <HiddenIds planId={planId} dayId={day.id} id={pe.id} />
                    <Button type="submit" variant="ghost" size="icon" aria-label="Quitar ejercicio">
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={library.length === 0}
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" /> Añadir ejercicio
        </Button>
        {library.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Crea ejercicios en la biblioteca para poder añadirlos.
          </p>
        ) : null}
      </div>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar día</DialogTitle>
          </DialogHeader>
          <RenameDayForm
            planId={planId}
            dayId={day.id}
            currentLabel={day.label}
            onDone={() => setRenaming(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir ejercicio a “{day.label}”</DialogTitle>
          </DialogHeader>
          <PlanExerciseForm
            planId={planId}
            dayId={day.id}
            library={library}
            onDone={() => setAdding(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ejercicio</DialogTitle>
          </DialogHeader>
          {editing ? (
            <PlanExerciseForm
              planId={planId}
              dayId={day.id}
              library={library}
              existing={editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

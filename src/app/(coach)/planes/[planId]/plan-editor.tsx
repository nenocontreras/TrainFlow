"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil } from "lucide-react";
import { deletePlanAction, setPlanArchivedAction } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { PlanForm } from "../plan-form";
import { DayCard } from "./day-card";
import { AddDayForm } from "./day-forms";
import { ExerciseCatalog } from "./exercise-catalog";
import { PlanExerciseForm } from "./plan-exercise-form";
import type { Exercise } from "@/lib/queries/exercises";
import type { PlanDetail, PlanExerciseDetail } from "@/lib/queries/plans";

type AddTarget = { dayId: string; exerciseId?: string };

export function PlanEditor({ plan, library }: { plan: PlanDetail; library: Exercise[] }) {
  const [editingPlan, setEditingPlan] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [editingExercise, setEditingExercise] = useState<{
    pe: PlanExerciseDetail;
    dayId: string;
  } | null>(null);

  const dayList = plan.days.map((d) => ({ id: d.id, label: d.label }));
  const hasDays = plan.days.length > 0;
  const canAddExercise = hasDays && library.length > 0;
  const firstDayId = plan.days[0]?.id;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/planes" className="text-muted-foreground text-sm underline">
        ← Planes
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl">{plan.name}</h1>
            {plan.archived ? <Badge variant="secondary">Archivado</Badge> : null}
          </div>
          {plan.description ? (
            <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">
            {plan.duration_weeks ? `${plan.duration_weeks} semanas · ` : ""}
            {plan.assignmentsCount} atleta{plan.assignmentsCount === 1 ? "" : "s"} asignado
            {plan.assignmentsCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar plan"
            onClick={() => setEditingPlan(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más acciones del plan">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <form
                id={`archive-plan-${plan.id}`}
                action={setPlanArchivedAction}
                className="hidden"
              >
                <input type="hidden" name="planId" value={plan.id} />
                <input type="hidden" name="archived" value={String(!plan.archived)} />
              </form>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  (
                    document.getElementById(`archive-plan-${plan.id}`) as HTMLFormElement | null
                  )?.requestSubmit();
                }}
              >
                {plan.archived ? "Desarchivar" : "Archivar"}
              </DropdownMenuItem>
              {plan.assignmentsCount === 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmingDelete(true)}
                  >
                    Eliminar plan
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {plan.assignmentsCount > 0 ? (
        <p className="bg-primary/10 rounded-md px-3 py-2 text-xs">
          Este plan tiene atletas asignados. Los cambios no afectan a las sesiones ya registradas.
        </p>
      ) : null}

      <div className="lg:grid lg:grid-cols-[20rem_1fr] lg:gap-8">
        {/* Catálogo — columna izquierda en desktop, oculto en móvil (se usa el
            botón "Añadir ejercicio" de cada día). */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <ExerciseCatalog
              library={library}
              disabled={!canAddExercise}
              onPick={(exerciseId) => firstDayId && setAddTarget({ dayId: firstDayId, exerciseId })}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-3">
          {plan.days.map((day, i) => (
            <DayCard
              key={day.id}
              planId={plan.id}
              day={day}
              isFirst={i === 0}
              isLast={i === plan.days.length - 1}
              canAddExercise={canAddExercise}
              onAddExercise={(dayId) => setAddTarget({ dayId })}
              onEditExercise={(pe) => setEditingExercise({ pe, dayId: day.id })}
            />
          ))}
          {!hasDays ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              Añade el primer día del plan.
            </p>
          ) : null}
          {hasDays && library.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Crea ejercicios en la biblioteca para poder añadirlos a los días.
            </p>
          ) : null}

          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">Añadir día</p>
            <AddDayForm planId={plan.id} />
          </div>
        </div>
      </div>

      {/* Diálogos ------------------------------------------------------------ */}
      <Dialog open={editingPlan} onOpenChange={setEditingPlan}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar plan</DialogTitle>
          </DialogHeader>
          <PlanForm plan={plan} onDone={() => setEditingPlan(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(addTarget)} onOpenChange={(o) => !o && setAddTarget(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir ejercicio</DialogTitle>
          </DialogHeader>
          {addTarget ? (
            <PlanExerciseForm
              planId={plan.id}
              days={dayList}
              currentDayId={addTarget.dayId}
              presetExerciseId={addTarget.exerciseId}
              library={library}
              onDone={() => setAddTarget(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingExercise)} onOpenChange={(o) => !o && setEditingExercise(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar ejercicio</DialogTitle>
          </DialogHeader>
          {editingExercise ? (
            <PlanExerciseForm
              planId={plan.id}
              days={dayList}
              currentDayId={editingExercise.dayId}
              library={library}
              existing={editingExercise.pe}
              onDone={() => setEditingExercise(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar “{plan.name}”</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán sus días y ejercicios. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <form action={deletePlanAction}>
              <input type="hidden" name="planId" value={plan.id} />
              <AlertDialogAction type="submit">Eliminar</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

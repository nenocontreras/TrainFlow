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
import type { Exercise } from "@/lib/queries/exercises";
import type { PlanDetail } from "@/lib/queries/plans";

export function PlanEditor({ plan, library }: { plan: PlanDetail; library: Exercise[] }) {
  const [editingPlan, setEditingPlan] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/planes" className="text-muted-foreground text-sm underline">
          ← Planes
        </Link>
        <div className="mt-1 flex items-start justify-between gap-2">
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
      </div>

      {plan.assignmentsCount > 0 ? (
        <p className="bg-primary/10 rounded-md px-3 py-2 text-xs">
          Este plan tiene atletas asignados. Los cambios no afectan a las sesiones ya registradas.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {plan.days.map((day, i) => (
          <DayCard
            key={day.id}
            planId={plan.id}
            day={day}
            library={library}
            isFirst={i === 0}
            isLast={i === plan.days.length - 1}
          />
        ))}
        {plan.days.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Añade el primer día del plan.
          </p>
        ) : null}
      </div>

      <div className="border-t pt-4">
        <p className="mb-2 text-sm font-medium">Añadir día</p>
        <AddDayForm planId={plan.id} />
      </div>

      <Dialog open={editingPlan} onOpenChange={setEditingPlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plan</DialogTitle>
          </DialogHeader>
          <PlanForm plan={plan} onDone={() => setEditingPlan(false)} />
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

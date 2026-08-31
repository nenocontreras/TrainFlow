"use client";

import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionSet } from "@/lib/queries/today";

export type SetPatch = {
  id: string;
  actualReps?: number | null;
  actualWeightKg?: number | null;
  completed?: boolean;
};

function Stepper({
  label,
  value,
  step,
  min = 0,
  onChange,
}: {
  label: string;
  value: number | null;
  step: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  const current = value ?? 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-muted-foreground text-[0.7rem] uppercase">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          aria-label={`${label} menos`}
          onClick={() => onChange(Math.max(min, Number((current - step).toFixed(2))))}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-12 text-center text-lg font-semibold tabular-nums">{value ?? "—"}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          aria-label={`${label} más`}
          onClick={() => onChange(Number((current + step).toFixed(2)))}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function SetRow({
  set,
  targetReps,
  onPatch,
}: {
  set: SessionSet;
  targetReps: string;
  onPatch: (patch: SetPatch) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border p-2",
        set.completed ? "border-primary/40 bg-primary/5" : "bg-background",
      )}
    >
      <span className="text-muted-foreground w-6 text-center text-sm font-semibold tabular-nums">
        {set.set_number}
      </span>

      <Stepper
        label="kg"
        value={set.actual_weight_kg}
        step={2.5}
        onChange={(v) => onPatch({ id: set.id, actualWeightKg: v })}
      />
      <Stepper
        label={`reps · ${targetReps}`}
        value={set.actual_reps}
        step={1}
        onChange={(v) => onPatch({ id: set.id, actualReps: v })}
      />

      <Button
        type="button"
        size="icon"
        variant={set.completed ? "default" : "outline"}
        className="size-11"
        aria-label={set.completed ? "Marcar como no hecha" : "Marcar serie como hecha"}
        aria-pressed={set.completed ?? false}
        onClick={() => onPatch({ id: set.id, completed: !set.completed })}
      >
        <Check className="size-5" />
      </Button>
    </div>
  );
}

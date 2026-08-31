"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Exercise } from "@/lib/queries/exercises";

const ALL = "__all__";

/**
 * Catálogo de ejercicios (columna izquierda en desktop). Cada "+" añade el
 * ejercicio al plan; el formulario resultante permite elegir el día.
 */
export function ExerciseCatalog({
  library,
  disabled,
  onPick,
}: {
  library: Exercise[];
  disabled: boolean;
  onPick: (exerciseId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(ALL);

  const groups = useMemo(
    () => [...new Set(library.map((e) => e.muscle_group).filter((v): v is string => !!v))].sort(),
    [library],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter(
      (e) =>
        (!q || e.name.toLowerCase().includes(q)) && (muscle === ALL || e.muscle_group === muscle),
    );
  }, [library, query, muscle]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-sm font-bold">Catálogo</h2>
        <p className="text-muted-foreground text-xs">Añade ejercicios al plan</p>
      </div>
      <div className="flex flex-col gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio…"
        />
        <select
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          aria-label="Filtrar por grupo muscular"
        >
          <option value={ALL}>Todos los grupos</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {disabled ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
          Añade al menos un día para poder meter ejercicios.
        </p>
      ) : null}

      <ul className="flex max-h-[60dvh] flex-col gap-1.5 overflow-y-auto pr-1">
        {filtered.map((ex) => (
          <li
            key={ex.id}
            className="bg-card flex items-center justify-between gap-2 rounded-md border p-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{ex.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {ex.muscle_group ? (
                  <Badge variant="secondary" className="text-[0.65rem]">
                    {ex.muscle_group}
                  </Badge>
                ) : null}
                {ex.equipment ? (
                  <Badge variant="secondary" className="text-[0.65rem]">
                    {ex.equipment}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={`Añadir ${ex.name} al plan`}
              onClick={() => onPick(ex.id)}
            >
              <Plus className="size-4" />
            </Button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="text-muted-foreground p-2 text-xs">Nada coincide.</li>
        ) : null}
      </ul>
    </div>
  );
}

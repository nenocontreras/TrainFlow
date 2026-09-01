"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import type { LoadPoint } from "@/lib/progress";
import type { TrackedExercise } from "@/lib/queries/coach";

// Recharts es pesado y esta pantalla es solo del coach: se carga aparte, sin SSR.
const ProgressChart = dynamic(
  () => import("@/components/progress-chart").then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => <div className="bg-muted/40 h-64 w-full animate-pulse rounded-lg" />,
  },
);

export function ProgressPanel({
  exercises,
  selectedId,
  points,
}: {
  exercises: TrackedExercise[];
  selectedId: string;
  points: LoadPoint[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("ej", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ej">Ejercicio</Label>
        <select
          id="ej"
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="border-input bg-background h-9 max-w-xs rounded-md border px-2 text-sm"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>
      <ProgressChart points={points} />
    </>
  );
}

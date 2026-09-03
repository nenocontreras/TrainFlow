"use client";

import { Button } from "@/components/ui/button";
import { formatMMSS } from "./use-rest-timer";

/**
 * Descanso a pantalla completa (opción 1b del diseño). Anuncia la siguiente
 * serie para que el atleta no tenga que leer nada más al volver a la barra.
 */
export function RestOverlay({
  left,
  total,
  elapsed,
  nextLabel,
  onAdd,
  onSkip,
}: {
  left: number;
  total: number;
  elapsed: number;
  nextLabel: string;
  onAdd: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Descanso"
      className="bg-background/95 fixed inset-0 z-40 flex flex-col items-center justify-center gap-7 px-8 backdrop-blur-lg"
    >
      <p className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.14em] uppercase">
        Descanso
      </p>

      <div
        className="flex size-[222px] items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${Math.round(elapsed * 360)}deg, color-mix(in oklch, var(--foreground) 14%, transparent) 0deg)`,
        }}
      >
        <div className="bg-background flex size-[186px] flex-col items-center justify-center rounded-full">
          <span className="font-display text-5xl tabular-nums">{formatMMSS(left)}</span>
          <span className="text-muted-foreground mt-2 font-mono text-[0.625rem] tracking-[0.1em] uppercase">
            de {formatMMSS(total)}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-primary font-mono text-[0.65rem] tracking-[0.1em] uppercase">Sigue</p>
        <p className="font-display mt-2 text-lg font-bold">{nextLabel}</p>
      </div>

      <div className="flex w-full gap-2.5">
        <Button variant="outline" className="h-13 flex-1 text-sm" onClick={onAdd}>
          +30 s
        </Button>
        <Button className="h-13 flex-1 text-sm" onClick={onSkip}>
          Saltar descanso
        </Button>
      </div>
    </div>
  );
}

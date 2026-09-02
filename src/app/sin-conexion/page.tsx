import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Sin conexión" };

// Página estática (sin datos ni sesión): la precachea el service worker y se
// muestra cuando una navegación falla sin conexión.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <WifiOff className="text-muted-foreground size-7" aria-hidden />
      </div>
      <h1 className="font-display text-xl font-bold">Sin conexión</h1>
      <p className="text-muted-foreground text-sm">
        No hay internet ahora mismo. Las pantallas que ya visitaste siguen disponibles; vuelve a
        intentarlo cuando recuperes la señal.
      </p>
    </main>
  );
}

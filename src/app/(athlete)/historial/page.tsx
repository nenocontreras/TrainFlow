import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Historial" };

export default async function HistoryPage() {
  await requireRole("athlete");
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl">Historial</h1>
      <p className="text-muted-foreground text-sm">
        Aquí verás tus entrenamientos pasados. Disponible en la Fase 4.
      </p>
    </section>
  );
}

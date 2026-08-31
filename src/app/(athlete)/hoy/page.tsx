import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Hoy" };

export default async function TodayPage() {
  const { profile } = await requireRole("athlete");
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl">Hola, {profile.full_name}</h1>
      <p className="text-muted-foreground">
        Aquí verás tu entrenamiento del día y registrarás tus series. Disponible cuando tu coach te
        asigne un plan (Fase 3).
      </p>
    </section>
  );
}

import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile } = await requireRole("coach");
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl">Hola, {profile.full_name}</h1>
      <p className="text-muted-foreground">
        Aquí verás a tus atletas y su adherencia. La biblioteca de ejercicios y el constructor de
        planes llegan en la Fase 2.
      </p>
    </section>
  );
}

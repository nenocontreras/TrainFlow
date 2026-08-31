import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listExercises } from "@/lib/queries/exercises";
import { listPlans } from "@/lib/queries/plans";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Panel" };

export default async function DashboardPage() {
  const { profile } = await requireRole("coach");
  const [plans, exercises] = await Promise.all([listPlans(), listExercises()]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Hola, {profile.full_name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Diseña planes desde tu biblioteca de ejercicios. Asignarlos a atletas llega en la Fase 3.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:max-w-md">
        <Link href="/planes" className="bg-card rounded-lg border p-4">
          <p className="text-3xl font-bold tabular-nums">{plans.length}</p>
          <p className="text-muted-foreground text-sm">{plans.length === 1 ? "plan" : "planes"}</p>
        </Link>
        <Link href="/ejercicios" className="bg-card rounded-lg border p-4">
          <p className="text-3xl font-bold tabular-nums">{exercises.length}</p>
          <p className="text-muted-foreground text-sm">
            {exercises.length === 1 ? "ejercicio" : "ejercicios"}
          </p>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild className="justify-between">
          <Link href="/planes/nuevo">
            Crear un plan <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-between">
          <Link href="/ejercicios">
            Gestionar ejercicios <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

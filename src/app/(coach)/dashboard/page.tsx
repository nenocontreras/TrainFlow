import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listAthletes } from "@/lib/queries/athletes";
import { listExercises } from "@/lib/queries/exercises";
import { listPlans } from "@/lib/queries/plans";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Panel" };

export default async function DashboardPage() {
  const { profile } = await requireRole("coach");
  const [plans, exercises, athletes] = await Promise.all([
    listPlans(),
    listExercises(),
    listAthletes(),
  ]);

  const stats = [
    { href: "/atletas", n: athletes.length, one: "atleta", many: "atletas" },
    { href: "/planes", n: plans.length, one: "plan", many: "planes" },
    { href: "/ejercicios", n: exercises.length, one: "ejercicio", many: "ejercicios" },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Hola, {profile.full_name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Diseña planes desde tu biblioteca de ejercicios y asígnalos a tus atletas.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:max-w-lg">
        {stats.map((s) => (
          <Link key={s.href} href={s.href} className="bg-card rounded-lg border p-4">
            <p className="text-3xl font-bold tabular-nums">{s.n}</p>
            <p className="text-muted-foreground text-sm">{s.n === 1 ? s.one : s.many}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:max-w-md">
        <Button asChild className="justify-between">
          <Link href="/planes/nuevo">
            Crear un plan <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-between">
          <Link href="/atletas">
            Gestionar atletas <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listExercises } from "@/lib/queries/exercises";
import { listPlans } from "@/lib/queries/plans";
import { listAthletesWithActivity } from "@/lib/queries/coach";
import type { AdherenceStats } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Panel" };

function recency(stats: AdherenceStats): {
  label: string;
  variant: "secondary" | "outline" | "destructive";
} {
  const d = stats.daysSinceLast;
  if (d === null) return { label: "Sin entrenamientos", variant: "outline" };
  if (d === 0) return { label: "Entrenó hoy", variant: "secondary" };
  if (d === 1) return { label: "Entrenó ayer", variant: "secondary" };
  if (d <= 7) return { label: `Hace ${d} días`, variant: "secondary" };
  if (d <= 14) return { label: `Hace ${d} días`, variant: "outline" };
  return { label: `Hace ${d} días`, variant: "destructive" };
}

export default async function DashboardPage() {
  const { profile } = await requireRole("coach");
  const [plans, exercises, athletes] = await Promise.all([
    listPlans(),
    listExercises(),
    listAthletesWithActivity(),
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
          Diseña planes desde tu biblioteca de ejercicios y sigue la adherencia de tus atletas.
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

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Actividad de atletas
        </h2>
        {athletes.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Aún no tienes atletas vinculados.{" "}
            <Link href="/atletas" className="underline">
              Añade el primero
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {athletes.map(({ athlete, stats: s }) => {
              const r = recency(s);
              const rate =
                s.setCompletionRate === null ? null : Math.round(s.setCompletionRate * 100);
              return (
                <li key={athlete.id}>
                  <Link
                    href={`/atletas/${athlete.id}`}
                    className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <span className="font-medium">{athlete.full_name}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.variant}>{r.label}</Badge>
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {s.sessionsLast7}/7 d · {s.sessionsLast30}/30 d
                        {rate !== null ? ` · ${rate}% series` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}

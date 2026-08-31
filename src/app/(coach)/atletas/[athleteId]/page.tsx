import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getAthlete } from "@/lib/queries/athletes";
import { assignablePlans, listAssignmentsForAthlete } from "@/lib/queries/assignments";
import { unassignPlanAction } from "@/lib/actions/assignments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignPlanDialog } from "./assign-plan-dialog";

export const metadata: Metadata = { title: "Atleta" };

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  await requireRole("coach");
  const { athleteId } = await params;

  const athlete = await getAthlete(athleteId);
  if (!athlete) notFound();

  const [assignments, plans] = await Promise.all([
    listAssignmentsForAthlete(athleteId),
    assignablePlans(athleteId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/atletas" className="text-muted-foreground text-sm underline">
        ← Atletas
      </Link>

      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl">{athlete.athlete.full_name}</h1>
        <AssignPlanDialog athleteId={athleteId} plans={plans} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Planes asignados
        </h2>
        {assignments.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Sin planes asignados todavía.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.plan?.name ?? "Plan"}</span>
                    {a.active ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Finalizado</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                    Desde {a.start_date} · {a.sessionsCount}{" "}
                    {a.sessionsCount === 1 ? "sesión" : "sesiones"}
                  </p>
                </div>
                {a.active ? (
                  <form action={unassignPlanAction}>
                    <input type="hidden" name="assignmentId" value={a.id} />
                    <input type="hidden" name="athleteId" value={athleteId} />
                    <Button type="submit" variant="ghost" size="sm">
                      Finalizar
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

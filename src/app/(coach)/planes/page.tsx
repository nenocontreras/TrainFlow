import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listPlans } from "@/lib/queries/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Planes" };

export default async function PlansPage() {
  await requireRole("coach");
  const plans = await listPlans();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Planes</h1>
        <Button asChild size="sm">
          <Link href="/planes/nuevo">
            <Plus className="size-4" /> Nuevo
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Todavía no has creado ningún plan.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link
                href={`/planes/${plan.id}`}
                className="bg-card hover:border-primary/50 block rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.name}</span>
                  {plan.archived ? <Badge variant="secondary">Archivado</Badge> : null}
                </div>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {plan.daysCount} {plan.daysCount === 1 ? "día" : "días"}
                  {plan.duration_weeks ? ` · ${plan.duration_weeks} semanas` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

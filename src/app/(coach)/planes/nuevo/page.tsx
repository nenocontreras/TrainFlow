import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Nuevo plan" };

export default async function NewPlanPage() {
  await requireRole("coach");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/planes" className="text-muted-foreground text-sm underline">
          ← Planes
        </Link>
        <h1 className="mt-1 text-2xl">Nuevo plan</h1>
      </div>
      <PlanForm />
    </div>
  );
}

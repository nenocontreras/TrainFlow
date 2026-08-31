import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getPlanDetail } from "@/lib/queries/plans";
import { listExercises } from "@/lib/queries/exercises";
import { PlanEditor } from "./plan-editor";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanEditorPage({ params }: { params: Promise<{ planId: string }> }) {
  await requireRole("coach");
  const { planId } = await params;
  const [plan, library] = await Promise.all([getPlanDetail(planId), listExercises()]);
  if (!plan) notFound();

  return <PlanEditor plan={plan} library={library} />;
}

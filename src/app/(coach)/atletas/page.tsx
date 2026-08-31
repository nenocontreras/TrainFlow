import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listAthletes } from "@/lib/queries/athletes";
import { AthletesList } from "./athletes-list";

export const metadata: Metadata = { title: "Atletas" };

export default async function AthletesPage() {
  await requireRole("coach");
  const athletes = await listAthletes();
  return <AthletesList athletes={athletes} />;
}

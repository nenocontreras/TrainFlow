import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTodayView } from "@/lib/queries/today";
import { TodayView } from "./today-view";

export const metadata: Metadata = { title: "Hoy" };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { profile } = await requireRole("athlete");
  const { dia } = await searchParams;
  const data = await getTodayView(dia);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Dumbbell className="text-muted-foreground size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Hola, {profile.full_name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Todavía no tienes un plan asignado. Tu coach te asignará uno pronto.
          </p>
        </div>
      </div>
    );
  }

  return <TodayView data={data} />;
}

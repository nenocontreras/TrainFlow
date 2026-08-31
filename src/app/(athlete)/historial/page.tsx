import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listMySessions } from "@/lib/queries/history";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Historial" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function HistoryPage() {
  await requireRole("athlete");
  const sessions = await listMySessions();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Historial</h1>

      {sessions.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Aún no has registrado ningún entrenamiento.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id} className="bg-card rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium capitalize">{formatDate(s.performedAt)}</span>
                {s.dayLabel ? <Badge variant="secondary">{s.dayLabel}</Badge> : null}
                <span className="text-muted-foreground text-sm tabular-nums">
                  {s.setsDone}/{s.setsTotal} series
                </span>
              </div>
              {s.athleteNote ? (
                <p className="text-muted-foreground mt-1 text-sm">{s.athleteNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

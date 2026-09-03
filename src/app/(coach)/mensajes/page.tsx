import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listCoachThreads } from "@/lib/queries/messages";

export const metadata: Metadata = { title: "Mensajes" };

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export default async function CoachInboxPage() {
  await requireRole("coach");
  const threads = await listCoachThreads();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Mensajes</h1>

      {threads.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Aún no tienes atletas vinculados con los que conversar.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((t) => (
            <li key={t.athleteId}>
              <Link
                href={`/mensajes/${t.athleteId}`}
                className="bg-card flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="bg-muted text-muted-foreground font-display flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {initials(t.athleteName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{t.athleteName}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[0.65rem]">
                      {timeAgo(t.lastAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground block truncate text-sm">
                    {t.lastText ?? "Sin mensajes todavía"}
                  </span>
                </span>
                {t.lastFromAthlete ? (
                  <span
                    className="bg-primary size-2 shrink-0 rounded-full"
                    aria-label="Pendiente"
                  />
                ) : (
                  <MessageCircle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

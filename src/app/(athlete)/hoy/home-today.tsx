"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { startSessionAction } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TodayDay } from "@/lib/queries/today";
import type { HomeStats } from "@/lib/home-stats";

/**
 * Inicio del atleta, jerarquía "sesión primero" (opción 1d): la tarjeta de hoy
 * ocupa el fold; los números viven debajo.
 *
 * `stats` es opcional: hasta que exista la consulta, la pantalla funciona sin
 * ella. Para poblarla, añade en `src/lib/queries/history.ts` un
 * `getAthleteHomeStats()` que agregue `session_sets` (peso × reps) por semana.
 */
export function HomeToday({
  planName,
  assignmentId,
  day,
  days,
  onPickDay,
  stats,
  unreadFromCoach,
}: {
  planName: string;
  assignmentId: string;
  day: TodayDay;
  days: TodayDay[];
  onPickDay: (id: string) => void;
  stats?: HomeStats;
  unreadFromCoach?: { author: string; preview: string } | null;
}) {
  const router = useRouter();
  const [starting, startTransition] = useTransition();
  const estimate = Math.max(20, day.exercises.length * 15);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.12em] uppercase">
            {new Date().toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </p>
          <h1 className="mt-1 text-2xl">Hoy te toca</h1>
        </div>
        {days.length > 1 ? (
          <select
            value={day.id}
            onChange={(e) => onPickDay(e.target.value)}
            aria-label="Elegir día"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          >
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        ) : null}
      </header>

      {/* Tarjeta protagonista */}
      <section className="bg-primary text-primary-foreground rounded-3xl p-5">
        <div className="flex items-baseline justify-between font-mono text-[0.65rem] tracking-[0.14em] uppercase opacity-70">
          <span>{planName}</span>
          <span>≈ {estimate} min</span>
        </div>
        <h2 className="font-display mt-2.5 text-3xl leading-none font-extrabold tracking-tight">
          {day.label}
        </h2>

        <ul className="mt-4 flex flex-col gap-1.5">
          {day.exercises.map((ex) => (
            <li
              key={ex.id}
              className="flex justify-between gap-3 border-t border-current/15 pt-1.5 text-sm font-medium"
            >
              <span className="min-w-0 truncate">{ex.exercise?.name ?? "Ejercicio"}</span>
              <span className="shrink-0 font-mono text-xs whitespace-nowrap opacity-80">
                {ex.target_sets} × {ex.target_reps}
              </span>
            </li>
          ))}
        </ul>

        <form
          action={(fd) =>
            startTransition(async () => {
              const res = await startSessionAction({}, fd);
              if (res.error) toast.error(res.error);
              else router.refresh();
            })
          }
        >
          <input type="hidden" name="planAssignmentId" value={assignmentId} />
          <input type="hidden" name="planDayId" value={day.id} />
          <Button
            type="submit"
            variant="secondary"
            className="font-display mt-4 h-14 w-full rounded-xl text-base"
            disabled={starting || day.exercises.length === 0}
          >
            {starting ? "Preparando…" : "Empezar sesión"}
          </Button>
        </form>
      </section>

      {stats ? (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <Stat n={String(stats.weekStreak)} label={"Semanas\nseguidas"} />
            <Stat n={`${stats.volume7dTons.toFixed(1)}t`} label={"Volumen\n7 días"} />
            <Stat n={String(stats.prsThisBlock)} label={"PR este\nbloque"} accent />
          </div>

          <section className="flex gap-1.5">
            {stats.week.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl border",
                  d.marca ? "border-primary/50 bg-primary/15" : "bg-card",
                )}
              >
                <span className="text-muted-foreground font-mono text-[0.6rem]">{d.dia}</span>
                <span className="font-display text-xs font-bold">{d.marca ?? "·"}</span>
              </div>
            ))}
          </section>
        </>
      ) : null}

      {unreadFromCoach ? (
        <Link href="/coach" className="bg-card flex items-center gap-3 rounded-2xl border p-3.5">
          <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold">
            {unreadFromCoach.author
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.8rem] font-semibold">
              {unreadFromCoach.author} · tu coach
            </span>
            <span className="text-muted-foreground block truncate text-[0.8rem]">
              {unreadFromCoach.preview}
            </span>
          </span>
          <span className="bg-primary ml-auto size-2 shrink-0 rounded-full" />
        </Link>
      ) : null}
    </div>
  );
}

function Stat({ n, label, accent }: { n: string; label: string; accent?: boolean }) {
  return (
    <div className="bg-card rounded-2xl border p-3.5">
      <p
        className={cn(
          "font-display text-2xl font-extrabold tabular-nums",
          accent && "text-primary",
        )}
      >
        {n}
      </p>
      <p className="text-muted-foreground mt-1 font-mono text-[0.625rem] leading-tight tracking-[0.06em] whitespace-pre-line uppercase">
        {label}
      </p>
    </div>
  );
}

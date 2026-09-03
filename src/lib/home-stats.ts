/**
 * Métricas del inicio del atleta (tarjeta `HomeToday`): racha semanal, volumen
 * de 7 días, PRs del bloque actual y marca de la semana en curso.
 *
 * Funciones puras — se testean en `home-stats.test.ts`. La consulta que las
 * alimenta está en `src/lib/queries/history.ts`.
 */
import { estimatedOneRepMax } from "@/lib/progress";

const DAY_MS = 86_400_000;

export interface StatSet {
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean | null;
  /** Ejercicio de biblioteca (instantánea, migración 0010). */
  exerciseId: string | null;
}

export interface StatSession {
  performedAt: string | null;
  dayLabel: string | null;
  sets: readonly StatSet[];
}

export interface HomeStats {
  /** Semanas consecutivas (lunes-domingo) con al menos una sesión. */
  weekStreak: number;
  /** Volumen de los últimos 7 días en toneladas (Σ peso·reps de series hechas / 1000). */
  volume7dTons: number;
  /** Ejercicios cuyo mejor 1RM estimado se logró dentro del bloque actual. */
  prsThisBlock: number;
  /** Los 7 días de la semana en curso: inicial + etiqueta del día entrenado. */
  week: { dia: string; marca: string | null }[];
}

const WEEKDAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];

/** Lunes 00:00 (hora local) de la semana que contiene `d`. */
function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return monday;
}

export function computeHomeStats(
  sessions: readonly StatSession[],
  nowISO: string,
  blockStartISO: string | null,
): HomeStats {
  const now = new Date(nowISO);
  const nowMs = now.getTime();
  const blockStart = blockStartISO
    ? Date.parse(`${blockStartISO}T00:00:00`)
    : Number.NEGATIVE_INFINITY;

  const dated = sessions
    .map((s) => ({ ...s, ms: s.performedAt ? Date.parse(s.performedAt) : NaN }))
    .filter((s) => Number.isFinite(s.ms));

  // --- Volumen 7 días -----------------------------------------------------
  let volumeKg = 0;
  for (const s of dated) {
    if (nowMs - s.ms > 7 * DAY_MS) continue;
    for (const set of s.sets) {
      if (!set.completed) continue;
      volumeKg += (set.actualWeightKg ?? 0) * (set.actualReps ?? 0);
    }
  }

  // --- Racha semanal ----------------------------------------------------
  const trainedWeeks = new Set(dated.map((s) => mondayOf(new Date(s.ms)).getTime()));
  const thisMonday = mondayOf(now).getTime();
  let weekStreak = 0;
  for (let i = 0; i < 104; i++) {
    const wk = thisMonday - i * 7 * DAY_MS;
    if (trainedWeeks.has(wk)) weekStreak++;
    else if (i === 0)
      continue; // la semana en curso puede estar aún sin entrenar
    else break;
  }

  // --- PRs del bloque -------------------------------------------------
  const bestAll = new Map<string, number>();
  const bestBlock = new Map<string, number>();
  for (const s of dated) {
    const inBlock = s.ms >= blockStart;
    for (const set of s.sets) {
      if (!set.completed || !set.exerciseId) continue;
      const e = estimatedOneRepMax(set.actualWeightKg ?? 0, set.actualReps ?? 0);
      if (e <= 0) continue;
      bestAll.set(set.exerciseId, Math.max(bestAll.get(set.exerciseId) ?? 0, e));
      if (inBlock) bestBlock.set(set.exerciseId, Math.max(bestBlock.get(set.exerciseId) ?? 0, e));
    }
  }
  let prsThisBlock = 0;
  for (const [exId, blockMax] of bestBlock) {
    // PR si el mejor de todos los tiempos se consiguió en el bloque (con margen
    // de redondeo).
    if (blockMax >= (bestAll.get(exId) ?? 0) - 0.001) prsThisBlock++;
  }

  // --- Semana en curso ----------------------------------------------
  const week = WEEKDAY_INITIALS.map((dia, idx) => {
    const dayStart = thisMonday + idx * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const session = dated.find((s) => s.ms >= dayStart && s.ms < dayEnd);
    return { dia, marca: session?.dayLabel ?? null };
  });

  return {
    weekStreak,
    volume7dTons: Math.round((volumeKg / 1000) * 10) / 10,
    prsThisBlock,
    week,
  };
}

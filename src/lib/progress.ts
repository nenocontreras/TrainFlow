/**
 * Lógica de progresión de carga y adherencia para el panel del coach (SPEC §7.7).
 *
 * Funciones puras, sin dependencias — se testean en `progress.test.ts`.
 * Decisiones de producto (ver conversación de la Fase 4):
 *  - Progresión: 1RM estimado por Epley de la mejor serie de cada sesión.
 *  - Adherencia: recencia + ritmo (sesiones en 7/30 días) + % de series
 *    completadas. El modelo "día de hoy" es rotación por progreso, sin
 *    calendario semanal, así que NO se inventa un objetivo de sesiones.
 */

const DAY_MS = 86_400_000;

export interface LoggedSet {
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean | null;
}

/**
 * 1RM estimado por la fórmula de Epley: `w · (1 + reps/30)`. Devuelve 0 si no
 * hay peso o reps válidos. Con 1 rep, el 1RM es el propio peso.
 */
export function estimatedOneRepMax(weightKg: number, reps: number): number {
  if (!(weightKg > 0) || !(reps > 0)) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export interface BestSet {
  weightKg: number;
  reps: number;
  oneRepMax: number;
}

/** La serie completada con mayor 1RM estimado, o `null` si no hay ninguna válida. */
export function bestSetOf(sets: readonly LoggedSet[]): BestSet | null {
  let best: BestSet | null = null;
  for (const s of sets) {
    if (!s.completed) continue;
    const weightKg = s.actualWeightKg ?? 0;
    const reps = s.actualReps ?? 0;
    const oneRepMax = estimatedOneRepMax(weightKg, reps);
    if (oneRepMax <= 0) continue;
    if (!best || oneRepMax > best.oneRepMax) best = { weightKg, reps, oneRepMax };
  }
  return best;
}

export interface SessionForSeries {
  performedAt: string | null;
  sets: readonly LoggedSet[];
}

export interface LoadPoint {
  /** Fecha `YYYY-MM-DD` (para el eje X). */
  date: string;
  /** 1RM estimado de la mejor serie, redondeado a 1 decimal. */
  oneRepMax: number;
  /** Peso de esa mejor serie. */
  topWeightKg: number;
  /** Reps de esa mejor serie. */
  reps: number;
}

/**
 * Serie temporal para la gráfica: un punto por sesión con al menos una serie
 * completada del ejercicio, ordenada de más antigua a más reciente.
 */
export function buildLoadSeries(sessions: readonly SessionForSeries[]): LoadPoint[] {
  const points: LoadPoint[] = [];
  for (const session of sessions) {
    if (!session.performedAt) continue;
    const best = bestSetOf(session.sets);
    if (!best) continue;
    points.push({
      date: session.performedAt.slice(0, 10),
      oneRepMax: Math.round(best.oneRepMax * 10) / 10,
      topWeightKg: best.weightKg,
      reps: best.reps,
    });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export interface SessionForAdherence {
  performedAt: string | null;
  /** Solo se mira `completed`; acepta cualquier serie con ese campo. */
  sets: readonly Pick<LoggedSet, "completed">[];
}

export interface AdherenceStats {
  lastSessionAt: string | null;
  /** Días completos transcurridos desde la última sesión (0 = hoy). */
  daysSinceLast: number | null;
  sessionsLast7: number;
  sessionsLast30: number;
  /** Series completadas / planificadas en las sesiones de los últimos 30 días. */
  setCompletionRate: number | null;
}

/**
 * Resumen de adherencia de un atleta a fecha `nowISO`. `sessions` puede venir en
 * cualquier orden.
 */
export function adherenceStats(
  sessions: readonly SessionForAdherence[],
  nowISO: string,
): AdherenceStats {
  const now = Date.parse(nowISO);
  const dated = sessions
    .map((s) => ({ ...s, ms: s.performedAt ? Date.parse(s.performedAt) : NaN }))
    .filter((s) => Number.isFinite(s.ms))
    .sort((a, b) => b.ms - a.ms);

  if (dated.length === 0) {
    return {
      lastSessionAt: null,
      daysSinceLast: null,
      sessionsLast7: 0,
      sessionsLast30: 0,
      setCompletionRate: null,
    };
  }

  const last = dated[0]!;
  const within = (days: number) => dated.filter((s) => now - s.ms <= days * DAY_MS).length;

  let done = 0;
  let planned = 0;
  for (const s of dated) {
    if (now - s.ms > 30 * DAY_MS) continue;
    for (const set of s.sets) {
      planned += 1;
      if (set.completed) done += 1;
    }
  }

  return {
    lastSessionAt: last.performedAt,
    daysSinceLast: Math.max(0, Math.floor((now - last.ms) / DAY_MS)),
    sessionsLast7: within(7),
    sessionsLast30: within(30),
    setCompletionRate: planned > 0 ? done / planned : null,
  };
}

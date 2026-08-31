/**
 * Lógica de "qué día del plan le toca hoy al atleta" (SPEC §7.5).
 *
 * Decisión de producto: rotación por progreso (estilo Hevy/Strong). El plan
 * tiene días 1..N; "hoy" = el siguiente del ciclo según cuántas sesiones se han
 * registrado ya para esa asignación. El atleta puede elegir otro día a mano.
 * `start_date` solo marca desde cuándo la asignación está activa.
 *
 * Funciones puras y sin dependencias — se testean en `today.test.ts`.
 */

/** ¿La asignación ya empezó a fecha `today` (YYYY-MM-DD, comparación de fechas)? */
export function hasStarted(startDate: string, today: string): boolean {
  return startDate <= today;
}

/**
 * Índice (0-based) del día del ciclo que toca ahora, dado cuántas sesiones se
 * han completado. Con 3 días y 4 sesiones -> índice 1 (Día 2).
 */
export function rotationIndex(sessionsCompleted: number, dayCount: number): number {
  if (dayCount <= 0) return 0;
  const n = Math.max(0, Math.floor(sessionsCompleted));
  return n % dayCount;
}

export interface DayLike {
  id: string;
  day_order: number;
}

/**
 * Elige el día a mostrar: el `pickedDayId` si es válido, si no el de la rotación.
 * Devuelve `null` si el plan no tiene días.
 */
export function resolveTodayDay<T extends DayLike>(
  days: readonly T[],
  sessionsCompleted: number,
  pickedDayId?: string | null,
): T | null {
  if (days.length === 0) return null;
  const ordered = [...days].sort((a, b) => a.day_order - b.day_order);
  if (pickedDayId) {
    const picked = ordered.find((d) => d.id === pickedDayId);
    if (picked) return picked;
  }
  return ordered[rotationIndex(sessionsCompleted, ordered.length)] ?? ordered[0]!;
}

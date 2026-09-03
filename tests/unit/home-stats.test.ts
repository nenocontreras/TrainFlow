import { describe, expect, it } from "vitest";
import { computeHomeStats, type StatSession } from "@/lib/home-stats";

const set = (
  actualWeightKg: number | null,
  actualReps: number | null,
  completed = true,
  exerciseId: string | null = "ex1",
) => ({ actualWeightKg, actualReps, completed, exerciseId });

// Miércoles 2026-03-04, 12:00 local.
const NOW = "2026-03-04T12:00:00";

describe("computeHomeStats", () => {
  it("valores neutros sin sesiones", () => {
    const s = computeHomeStats([], NOW, null);
    expect(s).toEqual({
      weekStreak: 0,
      volume7dTons: 0,
      prsThisBlock: 0,
      week: [
        { dia: "L", marca: null },
        { dia: "M", marca: null },
        { dia: "X", marca: null },
        { dia: "J", marca: null },
        { dia: "V", marca: null },
        { dia: "S", marca: null },
        { dia: "D", marca: null },
      ],
    });
  });

  it("volumen de 7 días en toneladas, solo series completadas", () => {
    const sessions: StatSession[] = [
      {
        performedAt: "2026-03-02T10:00:00", // hace 2 días
        dayLabel: "Empuje",
        sets: [set(100, 5), set(100, 5), set(200, 5, false)],
      },
      {
        performedAt: "2026-02-20T10:00:00", // fuera de los 7 días
        dayLabel: "Pierna",
        sets: [set(100, 10)],
      },
    ];
    // 100*5 + 100*5 = 1000 kg = 1.0 t
    expect(computeHomeStats(sessions, NOW, null).volume7dTons).toBe(1);
  });

  it("racha = semanas consecutivas con sesión, la semana en curso puede ir vacía", () => {
    const sessions: StatSession[] = [
      { performedAt: "2026-02-24T10:00:00", dayLabel: "A", sets: [] }, // semana -1
      { performedAt: "2026-02-17T10:00:00", dayLabel: "A", sets: [] }, // semana -2
      // hueco en semana -3
      { performedAt: "2026-02-02T10:00:00", dayLabel: "A", sets: [] }, // semana -4
    ];
    expect(computeHomeStats(sessions, NOW, null).weekStreak).toBe(2);
  });

  it("marca la semana en curso con la etiqueta del día entrenado", () => {
    const sessions: StatSession[] = [
      { performedAt: "2026-03-02T09:00:00", dayLabel: "Empuje", sets: [] }, // lunes
      { performedAt: "2026-03-04T09:00:00", dayLabel: "Tirón", sets: [] }, // miércoles (hoy)
    ];
    const week = computeHomeStats(sessions, NOW, null).week;
    expect(week[0]).toEqual({ dia: "L", marca: "Empuje" });
    expect(week[2]).toEqual({ dia: "X", marca: "Tirón" });
    expect(week[1]).toEqual({ dia: "M", marca: null });
  });

  it("cuenta un PR cuando el mejor 1RM del ejercicio cae dentro del bloque", () => {
    const sessions: StatSession[] = [
      // antes del bloque: 100x5 -> e1RM ~116.7
      {
        performedAt: "2026-01-10T10:00:00",
        dayLabel: "A",
        sets: [set(100, 5, true, "sentadilla")],
      },
      // dentro del bloque: 110x5 -> e1RM ~128.3 (nuevo máximo)
      {
        performedAt: "2026-02-15T10:00:00",
        dayLabel: "A",
        sets: [set(110, 5, true, "sentadilla")],
      },
      // otro ejercicio, sin superar nada nuevo en el bloque
      { performedAt: "2026-01-05T10:00:00", dayLabel: "A", sets: [set(80, 5, true, "press")] },
    ];
    // bloque empieza 2026-02-01
    expect(computeHomeStats(sessions, NOW, "2026-02-01").prsThisBlock).toBe(1);
  });
});

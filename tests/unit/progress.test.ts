import { describe, expect, it } from "vitest";
import {
  adherenceStats,
  bestSetOf,
  buildLoadSeries,
  estimatedOneRepMax,
  type LoggedSet,
} from "@/lib/progress";

const set = (
  actualWeightKg: number | null,
  actualReps: number | null,
  completed: boolean | null = true,
): LoggedSet => ({ actualWeightKg, actualReps, completed });

describe("estimatedOneRepMax", () => {
  it("aplica Epley: w · (1 + reps/30)", () => {
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(133.333, 2);
    expect(estimatedOneRepMax(60, 5)).toBeCloseTo(70, 5);
  });
  it("con 1 rep es el propio peso", () => {
    expect(estimatedOneRepMax(120, 1)).toBe(120);
  });
  it("es 0 sin peso o sin reps válidos", () => {
    expect(estimatedOneRepMax(0, 10)).toBe(0);
    expect(estimatedOneRepMax(100, 0)).toBe(0);
    expect(estimatedOneRepMax(-5, 5)).toBe(0);
  });
});

describe("bestSetOf", () => {
  it("elige la serie completada con mayor 1RM estimado", () => {
    const best = bestSetOf([
      set(100, 5), // e1RM ~116.7
      set(90, 12), // e1RM ~126
      set(110, 3), // e1RM ~121
    ]);
    expect(best).toEqual({ weightKg: 90, reps: 12, oneRepMax: estimatedOneRepMax(90, 12) });
  });
  it("ignora series no completadas", () => {
    const best = bestSetOf([set(200, 5, false), set(80, 5, true)]);
    expect(best?.weightKg).toBe(80);
  });
  it("null si no hay ninguna serie válida", () => {
    expect(bestSetOf([set(null, null), set(100, 0), set(0, 10)])).toBeNull();
    expect(bestSetOf([])).toBeNull();
  });
});

describe("buildLoadSeries", () => {
  it("un punto por sesión con serie válida, ordenado ascendente", () => {
    const series = buildLoadSeries([
      { performedAt: "2026-02-10T18:00:00Z", sets: [set(100, 5)] },
      { performedAt: "2026-02-03T18:00:00Z", sets: [set(95, 5)] },
      { performedAt: "2026-02-17T18:00:00Z", sets: [set(102.5, 5)] },
    ]);
    expect(series.map((p) => p.date)).toEqual(["2026-02-03", "2026-02-10", "2026-02-17"]);
    expect(series[2]).toMatchObject({ topWeightKg: 102.5, reps: 5 });
    expect(series[0]!.oneRepMax).toBe(Math.round(estimatedOneRepMax(95, 5) * 10) / 10);
  });
  it("descarta sesiones sin fecha o sin serie completada", () => {
    const series = buildLoadSeries([
      { performedAt: null, sets: [set(100, 5)] },
      { performedAt: "2026-02-03T18:00:00Z", sets: [set(100, 5, false)] },
      { performedAt: "2026-02-04T18:00:00Z", sets: [set(80, 8)] },
    ]);
    expect(series).toHaveLength(1);
    expect(series[0]!.date).toBe("2026-02-04");
  });
});

describe("adherenceStats", () => {
  const now = "2026-03-01T12:00:00Z";

  it("resume recencia, ritmo y % de series", () => {
    const stats = adherenceStats(
      [
        { performedAt: "2026-02-27T10:00:00Z", sets: [set(100, 5), set(100, 5, false)] },
        { performedAt: "2026-02-20T10:00:00Z", sets: [set(90, 8)] },
        { performedAt: "2026-01-05T10:00:00Z", sets: [set(80, 8)] }, // fuera de 30 días
      ],
      now,
    );
    expect(stats.lastSessionAt).toBe("2026-02-27T10:00:00Z");
    expect(stats.daysSinceLast).toBe(2);
    expect(stats.sessionsLast7).toBe(1);
    expect(stats.sessionsLast30).toBe(2);
    // 2 de 3 series completadas en la ventana de 30 días
    expect(stats.setCompletionRate).toBeCloseTo(2 / 3, 5);
  });

  it("valores neutros sin sesiones", () => {
    expect(adherenceStats([], now)).toEqual({
      lastSessionAt: null,
      daysSinceLast: null,
      sessionsLast7: 0,
      sessionsLast30: 0,
      setCompletionRate: null,
    });
  });

  it("setCompletionRate null si las sesiones recientes no tienen series", () => {
    const stats = adherenceStats([{ performedAt: "2026-02-28T10:00:00Z", sets: [] }], now);
    expect(stats.setCompletionRate).toBeNull();
    expect(stats.sessionsLast7).toBe(1);
  });

  it("ignora sesiones sin fecha parseable", () => {
    const stats = adherenceStats(
      [
        { performedAt: null, sets: [set(100, 5)] },
        { performedAt: "2026-02-25T10:00:00Z", sets: [set(100, 5)] },
      ],
      now,
    );
    expect(stats.sessionsLast30).toBe(1);
    expect(stats.lastSessionAt).toBe("2026-02-25T10:00:00Z");
  });
});

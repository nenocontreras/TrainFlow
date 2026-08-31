import { describe, expect, it } from "vitest";
import { hasStarted, resolveTodayDay, rotationIndex } from "@/lib/today";

describe("hasStarted", () => {
  it("compara fechas ISO como texto", () => {
    expect(hasStarted("2026-01-01", "2026-01-01")).toBe(true);
    expect(hasStarted("2026-02-01", "2026-01-15")).toBe(false);
    expect(hasStarted("2026-01-01", "2026-12-31")).toBe(true);
  });
});

describe("rotationIndex", () => {
  it("rota por el número de sesiones completadas", () => {
    expect(rotationIndex(0, 3)).toBe(0);
    expect(rotationIndex(1, 3)).toBe(1);
    expect(rotationIndex(3, 3)).toBe(0);
    expect(rotationIndex(4, 3)).toBe(1);
  });
  it("es 0 si no hay días", () => {
    expect(rotationIndex(5, 0)).toBe(0);
  });
  it("nunca es negativo", () => {
    expect(rotationIndex(-2, 3)).toBe(0);
  });
});

describe("resolveTodayDay", () => {
  const days = [
    { id: "b", day_order: 2 },
    { id: "a", day_order: 1 },
    { id: "c", day_order: 3 },
  ];

  it("null si el plan no tiene días", () => {
    expect(resolveTodayDay([], 0)).toBeNull();
  });

  it("ordena por day_order y aplica la rotación", () => {
    expect(resolveTodayDay(days, 0)?.id).toBe("a");
    expect(resolveTodayDay(days, 1)?.id).toBe("b");
    expect(resolveTodayDay(days, 4)?.id).toBe("b");
  });

  it("respeta el día elegido si es válido", () => {
    expect(resolveTodayDay(days, 0, "c")?.id).toBe("c");
  });

  it("ignora un día elegido inexistente y usa la rotación", () => {
    expect(resolveTodayDay(days, 1, "zzz")?.id).toBe("b");
  });
});

import { describe, expect, it } from "vitest";
import { assignPlanSchema } from "@/lib/validations/assignments";
import { linkAthleteSchema } from "@/lib/validations/athletes";
import { logSetSchema } from "@/lib/validations/sessions";

const UUID = "11111111-1111-1111-1111-111111111111";

describe("linkAthleteSchema", () => {
  it("normaliza el email", () => {
    expect(linkAthleteSchema.parse({ email: "  ME@Mail.COM " }).email).toBe("me@mail.com");
  });
  it("rechaza email inválido", () => {
    expect(linkAthleteSchema.safeParse({ email: "nop" }).success).toBe(false);
  });
});

describe("assignPlanSchema", () => {
  const base = { planId: UUID, athleteId: UUID, startDate: "2026-01-01" };
  it("acepta una asignación válida", () => {
    expect(assignPlanSchema.safeParse(base).success).toBe(true);
  });
  it("rechaza fecha con formato incorrecto", () => {
    expect(assignPlanSchema.safeParse({ ...base, startDate: "01/01/2026" }).success).toBe(false);
  });
  it("rechaza ids que no son uuid", () => {
    expect(assignPlanSchema.safeParse({ ...base, planId: "x" }).success).toBe(false);
  });
});

describe("logSetSchema", () => {
  it("coacciona 'true'/'false' a boolean y vacíos a undefined", () => {
    const r = logSetSchema.parse({
      setId: UUID,
      actualReps: "",
      actualWeightKg: "",
      completed: "true",
    });
    expect(r.completed).toBe(true);
    expect(r.actualReps).toBeUndefined();
    expect(r.actualWeightKg).toBeUndefined();
  });
  it("acepta peso decimal y reps entero", () => {
    const r = logSetSchema.parse({
      setId: UUID,
      actualReps: "8",
      actualWeightKg: "62.5",
      completed: false,
    });
    expect(r.actualReps).toBe(8);
    expect(r.actualWeightKg).toBe(62.5);
  });
  it("rechaza valores negativos", () => {
    expect(
      logSetSchema.safeParse({ setId: UUID, actualWeightKg: "-5", completed: false }).success,
    ).toBe(false);
  });
});

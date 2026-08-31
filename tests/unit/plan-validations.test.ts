import { describe, expect, it } from "vitest";
import { exerciseSchema } from "@/lib/validations/exercise";
import { planExerciseSchema, planSchema } from "@/lib/validations/plan";

describe("exerciseSchema", () => {
  it("normaliza campos vacíos a undefined", () => {
    const r = exerciseSchema.parse({
      name: "Press banca",
      muscleGroup: "  ",
      instructions: "",
      videoUrl: "",
    });
    expect(r).toEqual({ name: "Press banca" });
  });

  it("valida la URL de vídeo solo si viene", () => {
    expect(exerciseSchema.safeParse({ name: "Sentadilla", videoUrl: "no-url" }).success).toBe(
      false,
    );
    expect(
      exerciseSchema.safeParse({ name: "Sentadilla", videoUrl: "https://y.tube/x" }).success,
    ).toBe(true);
  });

  it("exige nombre de al menos 2 caracteres", () => {
    expect(exerciseSchema.safeParse({ name: "x" }).success).toBe(false);
  });
});

describe("planSchema", () => {
  it("acepta plan sin duración", () => {
    expect(planSchema.parse({ name: "Fuerza" })).toEqual({ name: "Fuerza" });
  });
  it("coacciona durationWeeks a entero y valida rango", () => {
    expect(planSchema.parse({ name: "Plan", durationWeeks: "8" }).durationWeeks).toBe(8);
    expect(planSchema.safeParse({ name: "Plan", durationWeeks: "0" }).success).toBe(false);
    expect(planSchema.safeParse({ name: "Plan", durationWeeks: "99" }).success).toBe(false);
  });
});

describe("planExerciseSchema", () => {
  const base = {
    exerciseId: "11111111-1111-1111-1111-111111111111",
    targetSets: "4",
    targetReps: "8-10",
  };

  it("acepta reps como texto libre y coacciona series", () => {
    const r = planExerciseSchema.parse(base);
    expect(r.targetSets).toBe(4);
    expect(r.targetReps).toBe("8-10");
  });

  it("rechaza exerciseId no-uuid", () => {
    expect(planExerciseSchema.safeParse({ ...base, exerciseId: "abc" }).success).toBe(false);
  });

  it("rechaza series fuera de 1..20", () => {
    expect(planExerciseSchema.safeParse({ ...base, targetSets: "0" }).success).toBe(false);
    expect(planExerciseSchema.safeParse({ ...base, targetSets: "50" }).success).toBe(false);
  });

  it("exige repeticiones no vacías", () => {
    expect(planExerciseSchema.safeParse({ ...base, targetReps: "" }).success).toBe(false);
  });
});

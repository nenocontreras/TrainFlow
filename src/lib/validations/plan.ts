import { z } from "zod";

/** Texto opcional: "" / null / undefined -> undefined. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
}

/** Entero opcional desde un campo de formulario ("" / null -> undefined). */
function optionalInt(min: number, max: number) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ message: "Debe ser un número" })
      .int("Debe ser un número entero")
      .min(min, `Mínimo ${min}`)
      .max(max, `Máximo ${max}`)
      .optional(),
  );
}

export const planSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  description: optionalText(2000),
  durationWeeks: optionalInt(1, 52),
});

export const planDaySchema = z.object({
  label: z.string().trim().min(1, "Ponle un nombre al día").max(80, "Máximo 80 caracteres"),
});

export const planExerciseSchema = z.object({
  exerciseId: z.guid("Elige un ejercicio"),
  targetSets: z.coerce.number().int().min(1, "Mínimo 1 serie").max(20, "Máximo 20"),
  targetReps: z
    .string()
    .trim()
    .min(1, "Indica las repeticiones (ej. 8-10, AMRAP)")
    .max(30, "Máximo 30 caracteres"),
  targetRestSeconds: optionalInt(0, 3600),
  coachNotes: optionalText(500),
});

export type PlanInput = z.infer<typeof planSchema>;
export type PlanDayInput = z.infer<typeof planDaySchema>;
export type PlanExerciseInput = z.infer<typeof planExerciseSchema>;

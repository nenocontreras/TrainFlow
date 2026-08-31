import { z } from "zod";

export const startSessionSchema = z.object({
  planAssignmentId: z.guid("Asignación no válida"),
  planDayId: z.guid("Día no válido"),
});

const optionalNonNegInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(0, "No puede ser negativo").max(10000).optional(),
);

const optionalWeight = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().min(0, "No puede ser negativo").max(1000).optional(),
);

export const logSetSchema = z.object({
  setId: z.guid("Serie no válida"),
  actualReps: optionalNonNegInt,
  actualWeightKg: optionalWeight,
  completed: z.preprocess((v) => v === "true" || v === true, z.boolean()),
});

export const finishSessionSchema = z.object({
  sessionId: z.guid("Sesión no válida"),
  athleteNote: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type LogSetInput = z.infer<typeof logSetSchema>;

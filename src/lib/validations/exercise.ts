import { z } from "zod";

/** Campo de texto opcional: "" se normaliza a undefined. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
}

export const exerciseSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  muscleGroup: optionalText(60),
  instructions: optionalText(2000),
  videoUrl: optionalText(500).pipe(z.string().url("URL inválida").optional()),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;

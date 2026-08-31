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
  movementPattern: optionalText(60),
  equipment: optionalText(40),
  tempo: optionalText(15),
  instructions: optionalText(2000),
  videoUrl: optionalText(500).pipe(z.string().url("URL inválida").optional()),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;

/** Sugerencias para los campos con `datalist` (no son valores cerrados). */
export const EQUIPMENT_OPTIONS = [
  "Barra",
  "Mancuernas",
  "Polea",
  "Peso corporal",
  "Máquina",
  "Kettlebell",
  "Banda",
] as const;

export const MOVEMENT_PATTERN_OPTIONS = [
  "Empuje horizontal",
  "Empuje vertical",
  "Tracción horizontal",
  "Tracción vertical",
  "Dominante de rodilla",
  "Dominante de cadera",
  "Zancada / unilateral",
  "Anti-extensión",
  "Anti-rotación",
  "Flexión de tronco",
  "Aislamiento",
] as const;

export const MUSCLE_GROUP_OPTIONS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Trapecio",
  "Cuádriceps",
  "Femoral y glúteo",
  "Glúteo",
  "Pantorrilla",
  "Bíceps",
  "Tríceps",
  "Core",
  "Antebrazo",
] as const;

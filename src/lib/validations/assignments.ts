import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha no válida");

export const assignPlanSchema = z.object({
  planId: z.guid("Plan no válido"),
  athleteId: z.guid("Atleta no válido"),
  startDate: isoDate,
});

export type AssignPlanInput = z.infer<typeof assignPlanSchema>;

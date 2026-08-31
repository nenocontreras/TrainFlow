import { z } from "zod";

export const linkAthleteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export const relationshipStatusSchema = z.object({
  athleteId: z.guid("Atleta no válido"),
  status: z.enum(["active", "paused", "ended"]),
});

export type LinkAthleteInput = z.infer<typeof linkAthleteSchema>;

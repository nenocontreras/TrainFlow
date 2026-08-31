import { z } from "zod";

export const linkAthleteSchema = z.object({
  // Mismo estilo que loginSchema en validations/auth.ts.
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export type LinkAthleteInput = z.infer<typeof linkAthleteSchema>;

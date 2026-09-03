import { z } from "zod";

export const sendMessageSchema = z.object({
  // El id del atleta identifica el hilo (para el coach y para el propio atleta).
  athleteId: z.guid(),
  body: z.string().trim().min(1, "Escribe un mensaje").max(2000, "Máximo 2000 caracteres"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface SendResult {
  ok: boolean;
  error?: string;
}

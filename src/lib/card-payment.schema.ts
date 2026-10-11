import { z } from "zod";

export const cardSubmissionSchema = z.object({
  orderId: z.string().uuid(),
  attemptKey: z.string().uuid(),
  card: z.object({
    token: z.string().min(1).max(300),
    payment_method_id: z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/),
    issuer_id: z.union([z.string().regex(/^\d{1,20}$/), z.number().int().nonnegative()]).optional(),
    installments: z.number().int().min(1).max(48),
    payer: z.object({
      email: z.string().email().max(200),
      identification: z.object({ type: z.literal("CPF"), number: z.string().regex(/^\d{11}$/) }),
    }),
  }),
});
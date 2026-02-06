import { z } from "zod";

import { firestoreTimestampSchema } from "./common.js";

export const exchangeStatusSchema = z.enum(["created", "closed"]);
export const exchangeDirectionSchema = z.enum(["give", "receive"]);

export const exchangeDocSchema = z
  .object({
    proposerUserId: z.string().min(1),
    receiverUserId: z.string().min(1),
    status: exchangeStatusSchema,
    createdAt: firestoreTimestampSchema,
  })
  .strict();

export const exchangeItemDocSchema = z
  .object({
    itemId: z.string().min(1),
    direction: exchangeDirectionSchema,
  })
  .strict();

export type ExchangeDoc = z.infer<typeof exchangeDocSchema>;
export type ExchangeItemDoc = z.infer<typeof exchangeItemDocSchema>;

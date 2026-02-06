import { z } from "zod";

export const firestoreTimestampSchema = z.union([
  z.date(),
  z.string().datetime(),
  z
    .object({
      seconds: z.number().int(),
      nanoseconds: z.number().int(),
    })
    .strict(),
]);

export const roleSchema = z.enum(["user", "admin"]);

export const paginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(12),
    cursor: z.string().optional(),
  })
  .strict();

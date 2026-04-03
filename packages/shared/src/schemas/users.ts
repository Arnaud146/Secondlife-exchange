import { z } from "zod";

import { firestoreTimestampSchema, roleSchema } from "./common.js";

export const userDocSchema = z
  .object({
    email: z.string().email(),
    role: roleSchema,
    createdAt: firestoreTimestampSchema,
  })
  .strict();

export const profileDocSchema = z
  .object({
    displayName: z.string().min(2).max(60),
    bio: z.string().max(500).default(""),
    locationOpt: z.string().max(120).nullable().optional(),
    preferences: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
      .refine((obj) => Object.keys(obj).length <= 20, "Too many preference keys (max 20)"),
    updatedAt: firestoreTimestampSchema,
  })
  .strict();

export const upsertProfileInputSchema = z
  .object({
    displayName: z.string().min(2).max(60),
    bio: z.string().max(500).optional(),
    locationOpt: z.string().max(120).nullable().optional(),
    preferences: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
      .refine((obj) => Object.keys(obj).length <= 20, "Too many preference keys (max 20)")
      .optional(),
  })
  .strict();

export type UserDoc = z.infer<typeof userDocSchema>;
export type ProfileDoc = z.infer<typeof profileDocSchema>;
export type UpsertProfileInput = z.infer<typeof upsertProfileInputSchema>;

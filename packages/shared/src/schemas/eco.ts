import { z } from "zod";

import { firestoreTimestampSchema } from "./common.js";

export const ecoContentTypeSchema = z.enum(["article", "video", "stat"]);

export const ecoContentDocSchema = z
  .object({
    themeWeekId: z.string().min(1).nullable().optional(),
    type: ecoContentTypeSchema,
    title: z.string().min(3).max(180),
    summary: z.string().min(10).max(1000),
    sourceUrl: z.string().url(),
    tags: z.array(z.string().min(2).max(30)).min(1).max(10),
    lang: z.string().min(2).max(10),
    publishedAt: firestoreTimestampSchema,
    createdAt: firestoreTimestampSchema,
  })
  .strict();

export const ecoViewDocSchema = z
  .object({
    contentId: z.string().min(1),
    themeWeekId: z.string().min(1).nullable().optional(),
    timestamp: firestoreTimestampSchema,
  })
  .strict();

export const ecoContentWithIdSchema = ecoContentDocSchema
  .extend({
    id: z.string().min(1),
  })
  .strict();

export const listEcoContentsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(24).default(8),
    cursor: z.string().min(1).optional(),
    type: ecoContentTypeSchema.optional(),
    tag: z.string().min(2).max(30).optional(),
    themeWeekId: z.string().min(1).optional(),
    lang: z.string().min(2).max(10).optional(),
  })
  .strict();

export const ecoContentIdInputSchema = z
  .object({
    contentId: z.string().min(1),
  })
  .strict();

export const createEcoContentInputSchema = z
  .object({
    themeWeekId: z.string().min(1).nullable().optional(),
    type: ecoContentTypeSchema,
    title: z.string().trim().min(3).max(180),
    summary: z.string().trim().min(10).max(1000),
    sourceUrl: z.string().url(),
    tags: z.array(z.string().trim().min(2).max(30)).min(1).max(10),
    lang: z.string().trim().min(2).max(10),
    publishedAtIso: z.string().datetime().optional(),
  })
  .strict();

export const trackEcoViewInputSchema = z
  .object({
    contentId: z.string().min(1),
    themeWeekId: z.string().min(1).nullable().optional(),
  })
  .strict();

export type EcoContentDoc = z.infer<typeof ecoContentDocSchema>;
export type EcoViewDoc = z.infer<typeof ecoViewDocSchema>;
export type EcoContentType = z.infer<typeof ecoContentTypeSchema>;
export type EcoContentWithId = z.infer<typeof ecoContentWithIdSchema>;
export type ListEcoContentsQuery = z.infer<typeof listEcoContentsQuerySchema>;
export type EcoContentIdInput = z.infer<typeof ecoContentIdInputSchema>;
export type CreateEcoContentInput = z.infer<typeof createEcoContentInputSchema>;
export type TrackEcoViewInput = z.infer<typeof trackEcoViewInputSchema>;

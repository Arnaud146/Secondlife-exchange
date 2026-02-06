import { z } from "zod";

import { firestoreTimestampSchema } from "./common.js";

export const themeSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "themeSlug must contain only lowercase letters, numbers, and hyphens");

export const themeWeekDocSchema = z
  .object({
    weekStart: firestoreTimestampSchema,
    weekEnd: firestoreTimestampSchema,
    themeSlug: themeSlugSchema,
    title: z.string().min(3).max(120),
    ecoImpactSummary: z.string().max(1000),
    createdAt: firestoreTimestampSchema,
  })
  .strict();

export const createThemeWeekInputSchema = z
  .object({
    weekStartIso: z.string().datetime(),
    weekEndIso: z.string().datetime(),
    themeSlug: themeSlugSchema,
    title: z.string().min(3).max(120),
    ecoImpactSummary: z.string().max(1000),
  })
  .strict()
  .superRefine((value, ctx) => {
    const start = new Date(value.weekStartIso);
    const end = new Date(value.weekEndIso);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid datetime range.",
        path: ["weekStartIso"],
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "weekEndIso must be after weekStartIso.",
        path: ["weekEndIso"],
      });
    }
  });

export const listThemeWeeksQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(24).default(12),
    cursor: z.string().min(1).optional(),
  })
  .strict();

export const themeWeekWithIdSchema = themeWeekDocSchema
  .extend({
    id: z.string().min(1),
  })
  .strict();

export type ThemeWeekDoc = z.infer<typeof themeWeekDocSchema>;
export type CreateThemeWeekInput = z.infer<typeof createThemeWeekInputSchema>;
export type ListThemeWeeksQuery = z.infer<typeof listThemeWeeksQuerySchema>;
export type ThemeWeekWithId = z.infer<typeof themeWeekWithIdSchema>;

import { z } from "zod";
import { aiProviderOutputSchema, themeSlugSchema } from "@secondlife/shared";

export const weeklySuggestionsOutputSchema = aiProviderOutputSchema;

export const weeklySuggestionsInputSchema = z
  .object({
    themeTitle: z.string().min(3).max(100),
    themeSlug: themeSlugSchema,
    weekStartIso: z.string().datetime(),
    weekEndIso: z.string().datetime(),
    desiredCount: z.number().int().min(3).max(20).default(8),
    language: z.string().min(2).max(10).default("fr"),
  })
  .strict();

export type WeeklySuggestionsInput = z.infer<typeof weeklySuggestionsInputSchema>;
export type WeeklySuggestionsOutput = z.infer<typeof weeklySuggestionsOutputSchema>;

import { z } from "zod";

import { firestoreTimestampSchema } from "./common.js";
import { themeSlugSchema } from "./themes.js";

export const aiDiversityFlagsSchema = z
  .object({
    vintage: z.boolean(),
    artisanal: z.boolean(),
    upcycled: z.boolean().optional(),
    repairable: z.boolean().optional(),
    localCraft: z.boolean().optional(),
  })
  .catchall(z.boolean());

export const aiProviderSuggestionSchema = z
  .object({
    title: z.string().min(3).max(120),
    rationale: z.string().min(12).max(600),
    tags: z.array(z.string().min(2).max(30)).min(2).max(8),
    categoryHints: z.array(z.string().min(2).max(40)).min(1).max(5),
    diversityFlags: aiDiversityFlagsSchema,
  })
  .strict();

export const aiProviderOutputSchema = z
  .object({
    suggestions: z.array(aiProviderSuggestionSchema).min(3).max(20),
  })
  .strict();

export const aiSuggestionDocSchema = z
  .object({
    themeWeekId: z.string().min(1),
    title: z.string().min(3).max(120),
    rationale: z.string().min(12).max(600),
    tags: z.array(z.string().min(2).max(30)).min(2).max(8),
    categoryHints: z.array(z.string().min(2).max(40)).min(1).max(5),
    diversityFlags: aiDiversityFlagsSchema,
    createdAt: firestoreTimestampSchema,
    published: z.boolean(),
    approvedBy: z.string().min(1).nullable(),
  })
  .strict();

export const aiSuggestionWithIdSchema = aiSuggestionDocSchema
  .extend({
    id: z.string().min(1),
  })
  .strict();

export const listPublishedAiSuggestionsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(24).default(8),
    cursor: z.string().min(1).optional(),
    themeWeekId: z.string().min(1).optional(),
  })
  .strict();

export const listPendingAiSuggestionsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(24).default(12),
    cursor: z.string().min(1).optional(),
    themeWeekId: z.string().min(1).optional(),
  })
  .strict();

export const suggestionIdInputSchema = z
  .object({
    suggestionId: z.string().min(1),
  })
  .strict();

export const generateWeeklySuggestionsCommandSchema = z
  .object({
    force: z.boolean().default(false),
    desiredCount: z.number().int().min(3).max(20).default(8),
    language: z.string().min(2).max(10).default("fr"),
    fallbackThemeSlug: themeSlugSchema.optional(),
  })
  .strict();

export type AiProviderOutput = z.infer<typeof aiProviderOutputSchema>;
export type AiSuggestionDoc = z.infer<typeof aiSuggestionDocSchema>;
export type AiSuggestionWithId = z.infer<typeof aiSuggestionWithIdSchema>;
export type ListPublishedAiSuggestionsQuery = z.infer<typeof listPublishedAiSuggestionsQuerySchema>;
export type ListPendingAiSuggestionsQuery = z.infer<typeof listPendingAiSuggestionsQuerySchema>;
export type SuggestionIdInput = z.infer<typeof suggestionIdInputSchema>;
export type GenerateWeeklySuggestionsCommand = z.infer<
  typeof generateWeeklySuggestionsCommandSchema
>;

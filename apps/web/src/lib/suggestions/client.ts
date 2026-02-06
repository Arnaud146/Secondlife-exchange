"use client";

import {
  aiSuggestionWithIdSchema,
  generateWeeklySuggestionsCommandSchema,
  listPendingAiSuggestionsQuerySchema,
  listPublishedAiSuggestionsQuerySchema,
  suggestionIdInputSchema,
} from "@secondlife/shared";
import { z } from "zod";

import { callFunction } from "@/lib/functions/client";

const listSuggestionsResponseSchema = z
  .object({
    suggestions: z.array(aiSuggestionWithIdSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();

const suggestionMutationResponseSchema = z
  .object({
    suggestionId: z.string().min(1),
  })
  .strict();

const generateWeeklySuggestionsResponseSchema = z
  .object({
    status: z.enum(["skipped_no_theme", "skipped_existing", "created"]),
    themeWeekId: z.string().nullable(),
    generatedCount: z.number().int().nonnegative(),
    existingCount: z.number().int().nonnegative(),
  })
  .strict();

export type SuggestionSummary = z.infer<typeof aiSuggestionWithIdSchema>;

export async function listPublishedAiSuggestions(
  input: z.input<typeof listPublishedAiSuggestionsQuerySchema>,
) {
  const query = listPublishedAiSuggestionsQuerySchema.parse(input);
  const data = await callFunction<unknown>("listPublishedAiSuggestions", {
    method: "GET",
    query: {
      limit: query.limit,
      cursor: query.cursor,
      themeWeekId: query.themeWeekId,
    },
  });

  return listSuggestionsResponseSchema.parse(data);
}

export async function listPendingAiSuggestions(
  input: z.input<typeof listPendingAiSuggestionsQuerySchema>,
) {
  const query = listPendingAiSuggestionsQuerySchema.parse(input);
  const data = await callFunction<unknown>("listPendingAiSuggestions", {
    method: "GET",
    query: {
      limit: query.limit,
      cursor: query.cursor,
      themeWeekId: query.themeWeekId,
    },
  });

  return listSuggestionsResponseSchema.parse(data);
}

export async function approveAiSuggestion(suggestionId: string) {
  const payload = suggestionIdInputSchema.parse({ suggestionId });
  const data = await callFunction<unknown>("approveAiSuggestion", {
    method: "POST",
    body: payload,
  });

  return suggestionMutationResponseSchema
    .extend({
      published: z.literal(true),
    })
    .parse(data);
}

export async function deleteAiSuggestion(suggestionId: string) {
  const payload = suggestionIdInputSchema.parse({ suggestionId });
  const data = await callFunction<unknown>("deleteAiSuggestion", {
    method: "POST",
    body: payload,
  });

  return suggestionMutationResponseSchema
    .extend({
      deleted: z.literal(true),
    })
    .parse(data);
}

export async function adminGenerateWeeklySuggestions(
  input: z.input<typeof generateWeeklySuggestionsCommandSchema>,
) {
  const payload = generateWeeklySuggestionsCommandSchema.parse(input);
  const data = await callFunction<unknown>("adminGenerateWeeklySuggestions", {
    method: "POST",
    body: payload,
  });

  return generateWeeklySuggestionsResponseSchema.parse(data);
}

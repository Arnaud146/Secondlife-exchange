"use client";

import {
  createThemeWeekInputSchema,
  listThemeWeeksQuerySchema,
  themeWeekWithIdSchema,
} from "@secondlife/shared";
import { z } from "zod";

import { callFunction } from "@/lib/functions/client";

const listThemeWeeksResponseSchema = z
  .object({
    themeWeeks: z.array(themeWeekWithIdSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();

const currentThemeWeekResponseSchema = z
  .object({
    currentTheme: themeWeekWithIdSchema.nullable(),
  })
  .strict();

export type ThemeWeekSummary = z.infer<typeof themeWeekWithIdSchema>;

export async function getCurrentThemeWeek() {
  const data = await callFunction<unknown>("getCurrentThemeWeek", {
    method: "GET",
  });

  return currentThemeWeekResponseSchema.parse(data);
}

export async function listThemeWeeks(input: z.input<typeof listThemeWeeksQuerySchema>) {
  const query = listThemeWeeksQuerySchema.parse(input);

  const data = await callFunction<unknown>("listThemeWeeks", {
    method: "GET",
    query: {
      limit: query.limit,
      cursor: query.cursor,
    },
  });

  return listThemeWeeksResponseSchema.parse(data);
}

export async function createThemeWeek(input: z.input<typeof createThemeWeekInputSchema>) {
  const payload = createThemeWeekInputSchema.parse(input);

  const data = await callFunction<unknown>("createThemeWeek", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      themeWeekId: z.string().min(1),
    })
    .parse(data);
}

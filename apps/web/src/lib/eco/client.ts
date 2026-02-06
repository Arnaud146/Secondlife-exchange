"use client";

import {
  createEcoContentInputSchema,
  ecoContentIdInputSchema,
  ecoContentWithIdSchema,
  listEcoContentsQuerySchema,
  trackEcoViewInputSchema,
} from "@secondlife/shared";
import { z } from "zod";

import { callFunction } from "@/lib/functions/client";

const listEcoContentsResponseSchema = z
  .object({
    ecoContents: z.array(ecoContentWithIdSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();

const ecoContentDetailResponseSchema = z
  .object({
    ecoContent: ecoContentWithIdSchema,
  })
  .strict();

export type EcoContentSummary = z.infer<typeof ecoContentWithIdSchema>;

export async function listEcoContents(input: z.input<typeof listEcoContentsQuerySchema>) {
  const query = listEcoContentsQuerySchema.parse(input);
  const data = await callFunction<unknown>("listEcoContents", {
    method: "GET",
    query: {
      limit: query.limit,
      cursor: query.cursor,
      type: query.type,
      tag: query.tag,
      themeWeekId: query.themeWeekId,
      lang: query.lang,
    },
  });

  return listEcoContentsResponseSchema.parse(data);
}

export async function getEcoContentDetail(contentId: string) {
  const parsed = ecoContentIdInputSchema.parse({ contentId });
  const data = await callFunction<unknown>("getEcoContentDetail", {
    method: "GET",
    query: {
      contentId: parsed.contentId,
    },
  });

  return ecoContentDetailResponseSchema.parse(data);
}

export async function trackEcoView(input: z.input<typeof trackEcoViewInputSchema>) {
  const payload = trackEcoViewInputSchema.parse(input);
  const data = await callFunction<unknown>("trackEcoView", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      viewId: z.string().min(1),
    })
    .parse(data);
}

export async function adminListEcoContents(input: z.input<typeof listEcoContentsQuerySchema>) {
  const query = listEcoContentsQuerySchema.parse(input);
  const data = await callFunction<unknown>("adminListEcoContents", {
    method: "GET",
    query: {
      limit: query.limit,
      cursor: query.cursor,
      type: query.type,
      tag: query.tag,
      themeWeekId: query.themeWeekId,
      lang: query.lang,
    },
  });

  return listEcoContentsResponseSchema.parse(data);
}

export async function adminCreateEcoContent(input: z.input<typeof createEcoContentInputSchema>) {
  const payload = createEcoContentInputSchema.parse(input);
  const data = await callFunction<unknown>("adminCreateEcoContent", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      contentId: z.string().min(1),
    })
    .parse(data);
}

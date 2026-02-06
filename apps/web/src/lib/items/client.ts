"use client";

import {
  addItemMediaInputSchema,
  archiveItemRequestSchema,
  createItemInputSchema,
  itemDocSchema,
  itemMediaDocSchema,
  listItemsQuerySchema,
  updateItemRequestSchema,
} from "@secondlife/shared";
import { z } from "zod";

import { callFunction } from "@/lib/functions/client";

const itemSummarySchema = itemDocSchema
  .extend({
    id: z.string().min(1),
  })
  .strict();

const itemMediaSummarySchema = itemMediaDocSchema
  .extend({
    id: z.string().min(1),
  })
  .strict();

const listItemsResponseSchema = z
  .object({
    items: z.array(itemSummarySchema),
    nextCursor: z.string().nullable(),
  })
  .strict();

const itemDetailResponseSchema = z
  .object({
    item: itemSummarySchema,
    media: z.array(itemMediaSummarySchema),
  })
  .strict();

export type ItemSummary = z.infer<typeof itemSummarySchema>;
export type ItemMediaSummary = z.infer<typeof itemMediaSummarySchema>;
export type ItemDetail = z.infer<typeof itemDetailResponseSchema>;

export async function createItem(input: z.input<typeof createItemInputSchema>) {
  const payload = createItemInputSchema.parse(input);
  const data = await callFunction<{ itemId: string }>("createItem", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      itemId: z.string().min(1),
    })
    .parse(data);
}

export async function listItems(input: z.input<typeof listItemsQuerySchema>) {
  const query = listItemsQuerySchema.parse(input);
  const data = await callFunction<unknown>("listItems", {
    method: "GET",
    query: {
      limit: query.limit,
      cursor: query.cursor,
      status: query.status,
      mine: query.mine,
    },
  });

  return listItemsResponseSchema.parse(data);
}

export async function getItemDetail(itemId: string) {
  const parsed = z.string().min(1).parse(itemId);
  const data = await callFunction<unknown>("getItemDetail", {
    method: "GET",
    query: { itemId: parsed },
  });

  return itemDetailResponseSchema.parse(data);
}

export async function updateItem(input: z.input<typeof updateItemRequestSchema>) {
  const payload = updateItemRequestSchema.parse(input);
  const data = await callFunction<{ itemId: string }>("updateItem", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      itemId: z.string().min(1),
    })
    .parse(data);
}

export async function archiveItem(itemId: string) {
  const payload = archiveItemRequestSchema.parse({ itemId });
  const data = await callFunction<{ itemId: string; status: "archived" }>("archiveItem", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      itemId: z.string().min(1),
      status: z.literal("archived"),
    })
    .parse(data);
}

export async function addItemMedia(input: z.input<typeof addItemMediaInputSchema>) {
  const payload = addItemMediaInputSchema.parse(input);
  const data = await callFunction<{ itemId: string; mediaId: string }>("addItemMedia", {
    method: "POST",
    body: payload,
  });

  return z
    .object({
      itemId: z.string().min(1),
      mediaId: z.string().min(1),
    })
    .parse(data);
}

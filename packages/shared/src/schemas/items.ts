import { z } from "zod";

import { firestoreTimestampSchema } from "./common.js";

export const itemStatusSchema = z.enum(["active", "archived"]);
export const itemStateSchema = z.enum(["new", "like_new", "good", "fair", "repair_needed"]);
export const itemImageMimeTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const MAX_ITEM_MEDIA_COUNT = 10;
export const MAX_ITEM_IMAGE_BYTES = 5 * 1024 * 1024;

export const itemDocSchema = z
  .object({
    ownerId: z.string().min(1),
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(3000),
    category: z.string().min(2).max(60),
    state: itemStateSchema,
    status: itemStatusSchema,
    themeWeekId: z.string().min(1).nullable().optional(),
    mediaCount: z.number().int().min(0).max(10),
    createdAt: firestoreTimestampSchema,
    updatedAt: firestoreTimestampSchema,
  })
  .strict();

export const itemMediaDocSchema = z
  .object({
    url: z.string().url(),
    type: itemImageMimeTypeSchema,
    createdAt: firestoreTimestampSchema,
  })
  .strict();

export const createItemInputSchema = z
  .object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(3000),
    category: z.string().min(2).max(60),
    state: itemStateSchema,
    themeWeekId: z.string().min(1).nullable().optional(),
  })
  .strict();

export const updateItemInputSchema = createItemInputSchema
  .partial()
  .extend({
    status: itemStatusSchema.optional(),
  })
  .strict();

export const itemIdInputSchema = z
  .object({
    itemId: z.string().min(1),
  })
  .strict();

export const listItemsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(24).default(12),
    cursor: z.string().min(1).optional(),
    status: itemStatusSchema.optional(),
    mine: z.boolean().optional().default(false),
  })
  .strict();

export const updateItemRequestSchema = z
  .object({
    itemId: z.string().min(1),
    data: updateItemInputSchema,
  })
  .strict();

export const archiveItemRequestSchema = z
  .object({
    itemId: z.string().min(1),
  })
  .strict();

export const addItemMediaInputSchema = z
  .object({
    itemId: z.string().min(1),
    url: z.string().url(),
    type: itemImageMimeTypeSchema,
  })
  .strict();

export type ItemDoc = z.infer<typeof itemDocSchema>;
export type ItemMediaDoc = z.infer<typeof itemMediaDocSchema>;
export type CreateItemInput = z.infer<typeof createItemInputSchema>;
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;
export type ItemIdInput = z.infer<typeof itemIdInputSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type UpdateItemRequest = z.infer<typeof updateItemRequestSchema>;
export type ArchiveItemRequest = z.infer<typeof archiveItemRequestSchema>;
export type AddItemMediaInput = z.infer<typeof addItemMediaInputSchema>;

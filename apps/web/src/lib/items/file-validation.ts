"use client";

import {
  MAX_ITEM_IMAGE_BYTES,
  MAX_ITEM_MEDIA_COUNT,
  itemImageMimeTypeSchema,
} from "@secondlife/shared";
import { z } from "zod";

const allowedTypes = new Set(itemImageMimeTypeSchema.options);

export const itemImageFileSchema = z
  .custom<File>((value) => value instanceof File, {
    message: "Invalid file.",
  })
  .refine(
    (file) => allowedTypes.has(file.type as (typeof itemImageMimeTypeSchema.options)[number]),
    {
      message: "Unsupported image type. Only JPEG, PNG and WEBP are allowed.",
    },
  )
  .refine((file) => file.size <= MAX_ITEM_IMAGE_BYTES, {
    message: `Image is too large. Maximum size is ${Math.floor(MAX_ITEM_IMAGE_BYTES / (1024 * 1024))}MB.`,
  });

export function validateItemImageFiles(files: File[]) {
  if (files.length > MAX_ITEM_MEDIA_COUNT) {
    throw new Error(`You can upload up to ${MAX_ITEM_MEDIA_COUNT} images per item.`);
  }

  return files.map((file) => itemImageFileSchema.parse(file));
}

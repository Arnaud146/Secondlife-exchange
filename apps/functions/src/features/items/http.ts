import {
  MAX_ITEM_MEDIA_COUNT,
  addItemMediaInputSchema,
  archiveItemRequestSchema,
  createItemInputSchema,
  itemIdInputSchema,
  listItemsQuerySchema,
  updateItemRequestSchema,
} from "@secondlife/shared";
import type { HttpsFunction, Request } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

import { env } from "../../config/env.js";
import { adminDb } from "../../lib/firebase-admin.js";
import {
  HttpError,
  assertMethod,
  handleHttpError,
  parseJsonBody,
  sendJson,
} from "../../lib/http.js";
import { assertWithinRateLimit } from "../../lib/rate-limit.js";
import { requireAuthContext } from "../../lib/request-auth.js";

type Response = Parameters<HttpsFunction>[1];

function queryParamValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

function queryBooleanValue(value: unknown): boolean | undefined {
  const raw = queryParamValue(value);
  if (raw === undefined) {
    return undefined;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }

  throw new HttpError(400, "Invalid boolean query parameter.");
}

function canManageItem(params: { ownerId: string; authUid: string; role: "user" | "admin" }) {
  return params.ownerId === params.authUid || params.role === "admin";
}

export async function createItemHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `items:create:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 20),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = createItemInputSchema.parse(body);

    const itemRef = adminDb.collection("items").doc();
    await itemRef.set({
      ownerId: auth.uid,
      title: input.title,
      description: input.description,
      category: input.category,
      state: input.state,
      status: "active",
      themeWeekId: input.themeWeekId ?? null,
      mediaCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    sendJson(res, 201, {
      success: true,
      data: {
        itemId: itemRef.id,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function listItemsHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `items:list:${auth.uid}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const queryInput = listItemsQuerySchema.parse({
      limit: queryParamValue(req.query.limit),
      cursor: queryParamValue(req.query.cursor),
      status: queryParamValue(req.query.status),
      mine: queryBooleanValue(req.query.mine),
    });

    let query = adminDb.collection("items").orderBy("createdAt", "desc").limit(queryInput.limit);

    if (queryInput.mine) {
      query = query.where("ownerId", "==", auth.uid);
    }

    if (queryInput.status) {
      query = query.where("status", "==", queryInput.status);
    }

    if (queryInput.cursor) {
      const cursorSnapshot = await adminDb.collection("items").doc(queryInput.cursor).get();
      if (cursorSnapshot.exists) {
        query = query.startAfter(cursorSnapshot);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const nextCursor =
      docs.length === queryInput.limit ? (docs[docs.length - 1]?.id ?? null) : null;

    sendJson(res, 200, {
      success: true,
      data: {
        items: docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
        nextCursor,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function getItemDetailHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `items:get:${auth.uid}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const input = itemIdInputSchema.parse({
      itemId: queryParamValue(req.query.itemId),
    });

    const itemRef = adminDb.collection("items").doc(input.itemId);
    const itemSnapshot = await itemRef.get();

    if (!itemSnapshot.exists) {
      throw new HttpError(404, "Item not found.");
    }

    const itemData = itemSnapshot.data();
    if (!itemData) {
      throw new HttpError(404, "Item not found.");
    }

    const canReadArchived =
      itemData.status !== "archived" ||
      canManageItem({
        ownerId: itemData.ownerId,
        authUid: auth.uid,
        role: auth.role,
      });

    if (!canReadArchived) {
      throw new HttpError(404, "Item not found.");
    }

    const mediaSnapshot = await itemRef
      .collection("media")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    sendJson(res, 200, {
      success: true,
      data: {
        item: {
          id: itemSnapshot.id,
          ...itemData,
        },
        media: mediaSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function updateItemHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `items:update:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 20),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = updateItemRequestSchema.parse(body);

    const itemRef = adminDb.collection("items").doc(input.itemId);
    const itemSnapshot = await itemRef.get();

    if (!itemSnapshot.exists) {
      throw new HttpError(404, "Item not found.");
    }

    const itemData = itemSnapshot.data();
    if (!itemData) {
      throw new HttpError(404, "Item not found.");
    }

    if (
      !canManageItem({
        ownerId: itemData.ownerId,
        authUid: auth.uid,
        role: auth.role,
      })
    ) {
      throw new HttpError(403, "Not allowed to update this item.");
    }

    const nextThemeWeekId =
      "themeWeekId" in input.data
        ? (input.data.themeWeekId ?? null)
        : (itemData.themeWeekId ?? null);

    await itemRef.set(
      {
        ...input.data,
        themeWeekId: nextThemeWeekId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    sendJson(res, 200, {
      success: true,
      data: {
        itemId: input.itemId,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function archiveItemHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `items:archive:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 15),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = archiveItemRequestSchema.parse(body);

    const itemRef = adminDb.collection("items").doc(input.itemId);
    const itemSnapshot = await itemRef.get();

    if (!itemSnapshot.exists) {
      throw new HttpError(404, "Item not found.");
    }

    const itemData = itemSnapshot.data();
    if (!itemData) {
      throw new HttpError(404, "Item not found.");
    }

    if (
      !canManageItem({
        ownerId: itemData.ownerId,
        authUid: auth.uid,
        role: auth.role,
      })
    ) {
      throw new HttpError(403, "Not allowed to archive this item.");
    }

    await itemRef.set(
      {
        status: "archived",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    sendJson(res, 200, {
      success: true,
      data: {
        itemId: input.itemId,
        status: "archived",
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function addItemMediaHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `items:addMedia:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 25),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = addItemMediaInputSchema.parse(body);

    const itemRef = adminDb.collection("items").doc(input.itemId);
    const mediaRef = itemRef.collection("media").doc();

    await adminDb.runTransaction(async (transaction) => {
      const itemSnapshot = await transaction.get(itemRef);

      if (!itemSnapshot.exists) {
        throw new HttpError(404, "Item not found.");
      }

      const itemData = itemSnapshot.data();
      if (!itemData) {
        throw new HttpError(404, "Item not found.");
      }

      if (
        !canManageItem({
          ownerId: itemData.ownerId,
          authUid: auth.uid,
          role: auth.role,
        })
      ) {
        throw new HttpError(403, "Not allowed to add media to this item.");
      }

      const currentCount = Number(itemData.mediaCount ?? 0);
      if (currentCount >= MAX_ITEM_MEDIA_COUNT) {
        throw new HttpError(400, "Maximum media count reached for this item.");
      }

      transaction.set(mediaRef, {
        url: input.url,
        type: input.type,
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        itemRef,
        {
          mediaCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    sendJson(res, 201, {
      success: true,
      data: {
        itemId: input.itemId,
        mediaId: mediaRef.id,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

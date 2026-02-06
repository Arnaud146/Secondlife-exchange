import {
  createEcoContentInputSchema,
  ecoContentIdInputSchema,
  listEcoContentsQuerySchema,
  trackEcoViewInputSchema,
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
import { assertAdminRole, requireAuthContext } from "../../lib/request-auth.js";

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

function getClientKey(req: Request): string {
  const forwardedFor = req.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();

  if (firstForwarded) {
    return firstForwarded;
  }

  return req.ip ?? "unknown";
}

function toDateSafe(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    const date = new Date((value as { seconds: number }).seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export async function listEcoContentsHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");

    assertWithinRateLimit({
      key: `eco:list:${getClientKey(req)}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const input = listEcoContentsQuerySchema.parse({
      limit: queryParamValue(req.query.limit),
      cursor: queryParamValue(req.query.cursor),
      type: queryParamValue(req.query.type),
      tag: queryParamValue(req.query.tag),
      themeWeekId: queryParamValue(req.query.themeWeekId),
      lang: queryParamValue(req.query.lang),
    });

    let query = adminDb
      .collection("ecoContents")
      .where("publishedAt", "<=", new Date())
      .orderBy("publishedAt", "desc")
      .limit(input.limit);

    if (input.type) {
      query = query.where("type", "==", input.type);
    }
    if (input.tag) {
      query = query.where("tags", "array-contains", input.tag);
    }
    if (input.themeWeekId) {
      query = query.where("themeWeekId", "==", input.themeWeekId);
    }
    if (input.lang) {
      query = query.where("lang", "==", input.lang);
    }

    if (input.cursor) {
      const cursorSnapshot = await adminDb.collection("ecoContents").doc(input.cursor).get();
      if (cursorSnapshot.exists) {
        query = query.startAfter(cursorSnapshot);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const nextCursor = docs.length === input.limit ? (docs[docs.length - 1]?.id ?? null) : null;

    sendJson(res, 200, {
      success: true,
      data: {
        ecoContents: docs.map((doc) => ({
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

export async function getEcoContentDetailHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");

    assertWithinRateLimit({
      key: `eco:detail:${getClientKey(req)}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const input = ecoContentIdInputSchema.parse({
      contentId: queryParamValue(req.query.contentId),
    });

    const contentRef = adminDb.collection("ecoContents").doc(input.contentId);
    const snapshot = await contentRef.get();
    if (!snapshot.exists) {
      throw new HttpError(404, "Eco content not found.");
    }

    const data = snapshot.data();
    if (!data) {
      throw new HttpError(404, "Eco content not found.");
    }

    const publishedAt = toDateSafe(data.publishedAt);
    const isPublished = publishedAt !== null && publishedAt <= new Date();

    if (!isPublished) {
      throw new HttpError(404, "Eco content not found.");
    }

    sendJson(res, 200, {
      success: true,
      data: {
        ecoContent: {
          id: snapshot.id,
          ...data,
        },
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function trackEcoViewHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");

    assertWithinRateLimit({
      key: `eco:view:${getClientKey(req)}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 40),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = trackEcoViewInputSchema.parse(body);

    const contentRef = adminDb.collection("ecoContents").doc(input.contentId);
    const contentSnapshot = await contentRef.get();
    if (!contentSnapshot.exists) {
      throw new HttpError(404, "Eco content not found.");
    }

    const contentData = contentSnapshot.data();
    if (!contentData) {
      throw new HttpError(404, "Eco content not found.");
    }

    const publishedAt = toDateSafe(contentData.publishedAt);
    if (!publishedAt || publishedAt > new Date()) {
      throw new HttpError(404, "Eco content not found.");
    }

    const trackedThemeWeekId =
      (typeof contentData.themeWeekId === "string" ? contentData.themeWeekId : null) ??
      input.themeWeekId ??
      null;

    const viewRef = adminDb.collection("ecoViews").doc();
    await viewRef.set({
      contentId: input.contentId,
      themeWeekId: trackedThemeWeekId,
      timestamp: FieldValue.serverTimestamp(),
    });

    sendJson(res, 201, {
      success: true,
      data: {
        viewId: viewRef.id,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function adminListEcoContentsHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `eco:adminList:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 20),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const input = listEcoContentsQuerySchema.parse({
      limit: queryParamValue(req.query.limit),
      cursor: queryParamValue(req.query.cursor),
      type: queryParamValue(req.query.type),
      tag: queryParamValue(req.query.tag),
      themeWeekId: queryParamValue(req.query.themeWeekId),
      lang: queryParamValue(req.query.lang),
    });

    let query = adminDb.collection("ecoContents").orderBy("createdAt", "desc").limit(input.limit);

    if (input.type) {
      query = query.where("type", "==", input.type);
    }
    if (input.tag) {
      query = query.where("tags", "array-contains", input.tag);
    }
    if (input.themeWeekId) {
      query = query.where("themeWeekId", "==", input.themeWeekId);
    }
    if (input.lang) {
      query = query.where("lang", "==", input.lang);
    }

    if (input.cursor) {
      const cursorSnapshot = await adminDb.collection("ecoContents").doc(input.cursor).get();
      if (cursorSnapshot.exists) {
        query = query.startAfter(cursorSnapshot);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const nextCursor = docs.length === input.limit ? (docs[docs.length - 1]?.id ?? null) : null;

    sendJson(res, 200, {
      success: true,
      data: {
        ecoContents: docs.map((doc) => ({
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

export async function adminCreateEcoContentHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `eco:adminCreate:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 15),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = createEcoContentInputSchema.parse(body);

    const publishedAt = input.publishedAtIso ? new Date(input.publishedAtIso) : new Date();
    if (Number.isNaN(publishedAt.getTime())) {
      throw new HttpError(400, "Invalid publishedAtIso.");
    }

    const contentRef = adminDb.collection("ecoContents").doc();
    await contentRef.set({
      themeWeekId: input.themeWeekId ?? null,
      type: input.type,
      title: input.title,
      summary: input.summary,
      sourceUrl: input.sourceUrl,
      tags: input.tags,
      lang: input.lang,
      publishedAt,
      createdAt: FieldValue.serverTimestamp(),
    });

    sendJson(res, 201, {
      success: true,
      data: {
        contentId: contentRef.id,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

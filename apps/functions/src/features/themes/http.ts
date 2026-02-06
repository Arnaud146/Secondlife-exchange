import { createThemeWeekInputSchema, listThemeWeeksQuerySchema } from "@secondlife/shared";
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

function getClientKey(req: Request): string {
  const forwardedFor = req.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();

  if (firstForwarded) {
    return firstForwarded;
  }

  return req.ip ?? "unknown";
}

export async function getCurrentThemeWeekHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");

    assertWithinRateLimit({
      key: `themes:current:${getClientKey(req)}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const now = new Date();
    const snapshot = await adminDb
      .collection("themeWeeks")
      .where("weekStart", "<=", now)
      .orderBy("weekStart", "desc")
      .limit(24)
      .get();

    const currentDoc = snapshot.docs.find((doc) => {
      const data = doc.data();
      const weekEnd = toDateSafe(data.weekEnd);
      return weekEnd !== null && weekEnd >= now;
    });

    if (!currentDoc) {
      sendJson(res, 200, {
        success: true,
        data: {
          currentTheme: null,
        },
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      data: {
        currentTheme: {
          id: currentDoc.id,
          ...currentDoc.data(),
        },
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function listThemeWeeksHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");

    assertWithinRateLimit({
      key: `themes:list:${getClientKey(req)}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const queryInput = listThemeWeeksQuerySchema.parse({
      limit: queryParamValue(req.query.limit),
      cursor: queryParamValue(req.query.cursor),
    });

    let query = adminDb
      .collection("themeWeeks")
      .orderBy("weekStart", "desc")
      .limit(queryInput.limit);

    if (queryInput.cursor) {
      const cursorSnapshot = await adminDb.collection("themeWeeks").doc(queryInput.cursor).get();
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
        themeWeeks: docs.map((doc) => ({
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

export async function createThemeWeekHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `themes:create:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 10),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = createThemeWeekInputSchema.parse(body);

    const weekStart = new Date(input.weekStartIso);
    const weekEnd = new Date(input.weekEndIso);

    if (
      Number.isNaN(weekStart.getTime()) ||
      Number.isNaN(weekEnd.getTime()) ||
      weekEnd <= weekStart
    ) {
      throw new HttpError(400, "Invalid week range.");
    }

    const overlapCandidates = await adminDb
      .collection("themeWeeks")
      .where("weekStart", "<=", weekEnd)
      .orderBy("weekStart", "desc")
      .get();

    const hasOverlap = overlapCandidates.docs.some((doc) => {
      const data = doc.data();
      const existingStart = toDateSafe(data.weekStart);
      const existingEnd = toDateSafe(data.weekEnd);

      if (!existingStart || !existingEnd) {
        return false;
      }

      return existingStart < weekEnd && existingEnd > weekStart;
    });

    if (hasOverlap) {
      throw new HttpError(409, "Theme week overlaps an existing theme range.");
    }

    const themeRef = adminDb.collection("themeWeeks").doc();
    await themeRef.set({
      weekStart,
      weekEnd,
      themeSlug: input.themeSlug,
      title: input.title,
      ecoImpactSummary: input.ecoImpactSummary,
      createdAt: FieldValue.serverTimestamp(),
    });

    sendJson(res, 201, {
      success: true,
      data: {
        themeWeekId: themeRef.id,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

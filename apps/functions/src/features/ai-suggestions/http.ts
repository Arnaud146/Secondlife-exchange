import {
  generateWeeklySuggestionsCommandSchema,
  listPendingAiSuggestionsQuerySchema,
  listPublishedAiSuggestionsQuerySchema,
  suggestionIdInputSchema,
} from "@secondlife/shared";
import type { HttpsFunction, Request } from "firebase-functions/v2/https";

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
import { generateWeeklySuggestionsForCurrentTheme } from "./service.js";

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

export async function listPublishedAiSuggestionsHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `aiSuggestions:published:${auth.uid}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const input = listPublishedAiSuggestionsQuerySchema.parse({
      limit: queryParamValue(req.query.limit),
      cursor: queryParamValue(req.query.cursor),
      themeWeekId: queryParamValue(req.query.themeWeekId),
    });

    let query = adminDb
      .collection("aiSuggestions")
      .where("published", "==", true)
      .orderBy("createdAt", "desc")
      .limit(input.limit);

    if (input.themeWeekId) {
      query = query.where("themeWeekId", "==", input.themeWeekId);
    }

    if (input.cursor) {
      const cursorSnapshot = await adminDb.collection("aiSuggestions").doc(input.cursor).get();
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
        suggestions: docs.map((doc) => ({
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

export async function listPendingAiSuggestionsHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `aiSuggestions:pending:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 20),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const input = listPendingAiSuggestionsQuerySchema.parse({
      limit: queryParamValue(req.query.limit),
      cursor: queryParamValue(req.query.cursor),
      themeWeekId: queryParamValue(req.query.themeWeekId),
    });

    let query = adminDb
      .collection("aiSuggestions")
      .where("published", "==", false)
      .orderBy("createdAt", "desc")
      .limit(input.limit);

    if (input.themeWeekId) {
      query = query.where("themeWeekId", "==", input.themeWeekId);
    }

    if (input.cursor) {
      const cursorSnapshot = await adminDb.collection("aiSuggestions").doc(input.cursor).get();
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
        suggestions: docs.map((doc) => ({
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

export async function approveAiSuggestionHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `aiSuggestions:approve:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 20),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = suggestionIdInputSchema.parse(body);

    const suggestionRef = adminDb.collection("aiSuggestions").doc(input.suggestionId);
    const suggestionSnapshot = await suggestionRef.get();
    if (!suggestionSnapshot.exists) {
      throw new HttpError(404, "Suggestion not found.");
    }

    await suggestionRef.set(
      {
        published: true,
        approvedBy: auth.uid,
      },
      { merge: true },
    );

    sendJson(res, 200, {
      success: true,
      data: {
        suggestionId: input.suggestionId,
        published: true,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function deleteAiSuggestionHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `aiSuggestions:delete:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 15),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = suggestionIdInputSchema.parse(body);

    const suggestionRef = adminDb.collection("aiSuggestions").doc(input.suggestionId);
    const suggestionSnapshot = await suggestionRef.get();
    if (!suggestionSnapshot.exists) {
      throw new HttpError(404, "Suggestion not found.");
    }

    await suggestionRef.delete();

    sendJson(res, 200, {
      success: true,
      data: {
        suggestionId: input.suggestionId,
        deleted: true,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function adminGenerateWeeklySuggestionsHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `aiSuggestions:generate:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 5),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = generateWeeklySuggestionsCommandSchema.parse(body);

    const result = await generateWeeklySuggestionsForCurrentTheme({
      force: input.force,
      desiredCount: input.desiredCount,
      language: input.language,
      fallbackThemeSlug: input.fallbackThemeSlug,
    });

    sendJson(res, 200, {
      success: true,
      data: result,
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

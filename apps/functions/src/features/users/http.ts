import { upsertProfileInputSchema } from "@secondlife/shared";
import type { HttpsFunction, Request } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

import { env } from "../../config/env.js";
import { adminDb } from "../../lib/firebase-admin.js";
import { assertMethod, handleHttpError, parseJsonBody, sendJson } from "../../lib/http.js";
import { assertWithinRateLimit } from "../../lib/rate-limit.js";
import { requireAuthContext } from "../../lib/request-auth.js";

type Response = Parameters<HttpsFunction>[1];

function defaultDisplayName(email: string) {
  return email.split("@")[0] ?? "Member";
}

export async function getMyProfileHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `profile:get:${auth.uid}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const profileRef = adminDb.collection("profiles").doc(auth.uid);
    const profileSnapshot = await profileRef.get();

    if (!profileSnapshot.exists) {
      await profileRef.set({
        displayName: defaultDisplayName(auth.email),
        bio: "",
        locationOpt: null,
        preferences: {},
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const refreshedSnapshot = await profileRef.get();
    sendJson(res, 200, {
      success: true,
      data: refreshedSnapshot.data(),
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

export async function upsertMyProfileHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "POST");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `profile:upsert:${auth.uid}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const body = parseJsonBody<unknown>(req);
    const input = upsertProfileInputSchema.parse(body);

    await adminDb.collection("users").doc(auth.uid).set(
      {
        email: auth.email,
      },
      { merge: true },
    );

    await adminDb
      .collection("profiles")
      .doc(auth.uid)
      .set(
        {
          displayName: input.displayName,
          bio: input.bio ?? "",
          locationOpt: input.locationOpt ?? null,
          preferences: input.preferences ?? {},
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    sendJson(res, 200, {
      success: true,
      data: {
        uid: auth.uid,
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

import type { HttpsFunction, Request } from "firebase-functions/v2/https";

import { env } from "../../config/env.js";
import { adminDb } from "../../lib/firebase-admin.js";
import { assertMethod, handleHttpError, sendJson } from "../../lib/http.js";
import { assertWithinRateLimit } from "../../lib/rate-limit.js";
import { assertAdminRole, requireAuthContext } from "../../lib/request-auth.js";

type Response = Parameters<HttpsFunction>[1];

export async function adminListUsersHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);
    assertAdminRole(auth);

    assertWithinRateLimit({
      key: `admin:listUsers:${auth.uid}`,
      maxTokens: Math.min(env.RATE_LIMIT_MAX, 15),
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    const snapshot = await adminDb.collection("users").limit(50).get();
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email ?? "",
      role: doc.data().role ?? "user",
      createdAt: doc.data().createdAt ?? null,
    }));

    sendJson(res, 200, {
      success: true,
      data: users,
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

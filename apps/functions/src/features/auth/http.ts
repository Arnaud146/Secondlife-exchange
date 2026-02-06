import type { HttpsFunction, Request } from "firebase-functions/v2/https";

type Response = Parameters<HttpsFunction>[1];

import { env } from "../../config/env.js";
import { assertMethod, handleHttpError, sendJson } from "../../lib/http.js";
import { assertWithinRateLimit } from "../../lib/rate-limit.js";
import { requireAuthContext } from "../../lib/request-auth.js";

export async function getSessionContextHandler(req: Request, res: Response) {
  try {
    assertMethod(req, "GET");
    const auth = await requireAuthContext(req);

    assertWithinRateLimit({
      key: `auth:context:${auth.uid}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    sendJson(res, 200, {
      success: true,
      data: auth,
    });
  } catch (error) {
    handleHttpError(res, error);
  }
}

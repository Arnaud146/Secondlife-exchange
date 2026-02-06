import type { HttpsFunction, Request } from "firebase-functions/v2/https";

type Response = Parameters<HttpsFunction>[1];

export type HttpHandler = (req: Request, res: Response) => void | Promise<void>;

/**
 * Wraps an HTTP handler with explicit CORS support.
 *
 * This replaces the built-in `cors: true` option on `onRequest` which can
 * silently fail during cold starts, leaving preflight OPTIONS requests
 * without the required `Access-Control-Allow-Origin` header.
 */
export function withCors(handler: HttpHandler): HttpHandler {
  return async (req, res) => {
    const origin = req.headers.origin;

    res.set("Access-Control-Allow-Origin", origin || "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    await handler(req, res);
  };
}

export class HttpError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function sendJson(res: Response, status: number, payload: unknown) {
  res.status(status).json(payload);
}

export function parseJsonBody<T>(req: Request): T {
  if (!req.body || typeof req.body !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }
  return req.body as T;
}

export function assertMethod(req: Request, expected: string) {
  if (req.method.toUpperCase() !== expected.toUpperCase()) {
    throw new HttpError(405, `Method ${req.method} not allowed.`);
  }
}

export function handleHttpError(res: Response, error: unknown) {
  if (error instanceof HttpError) {
    sendJson(res, error.status, {
      success: false,
      error: {
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  sendJson(res, 500, {
    success: false,
    error: {
      message: "Internal server error.",
    },
  });
}

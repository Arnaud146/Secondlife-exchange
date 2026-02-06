import type { HttpsFunction, Request } from "firebase-functions/v2/https";

type Response = Parameters<HttpsFunction>[1];

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

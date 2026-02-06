import { roleSchema } from "@secondlife/shared";
import type { Request } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "./firebase-admin.js";
import { HttpError } from "./http.js";

export type RequestAuthContext = {
  uid: string;
  email: string;
  role: "user" | "admin";
};

function extractBearerToken(req: Request): string {
  const authHeader = req.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Missing bearer token.");
  }

  return token;
}

export async function requireAuthContext(req: Request): Promise<RequestAuthContext> {
  const token = extractBearerToken(req);

  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;

  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    throw new HttpError(401, "Invalid or revoked Firebase token.");
  }

  const email = decodedToken.email;
  if (!email) {
    throw new HttpError(401, "Authenticated token has no email.");
  }

  const userRef = adminDb.collection("users").doc(decodedToken.uid);
  const userSnapshot = await userRef.get();

  let role: "user" | "admin" = "user";

  if (userSnapshot.exists) {
    const roleResult = roleSchema.safeParse(userSnapshot.data()?.role);
    role = roleResult.success ? roleResult.data : "user";
  } else {
    await userRef.set({
      email,
      role: "user",
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    uid: decodedToken.uid,
    email,
    role,
  };
}

export function assertAdminRole(context: RequestAuthContext) {
  if (context.role !== "admin") {
    throw new HttpError(403, "Admin role required.");
  }
}

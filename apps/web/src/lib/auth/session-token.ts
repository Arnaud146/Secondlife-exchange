import { appSessionClaimsSchema, type AppSessionClaims } from "@secondlife/shared";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

const jwtPayloadSchema = appSessionClaimsSchema
  .extend({
    iat: z.number().int().optional(),
    exp: z.number().int().optional(),
    sub: z.string().optional(),
  })
  .strict();

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be set and at least 32 chars.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: AppSessionClaims): Promise<string> {
  const secret = getSessionSecret();

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AppSessionClaims | null> {
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const parsed = jwtPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return null;
    }

    return appSessionClaimsSchema.parse({
      uid: parsed.data.uid,
      role: parsed.data.role,
      email: parsed.data.email,
    });
  } catch {
    return null;
  }
}

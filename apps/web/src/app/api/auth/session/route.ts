import { establishSessionInputSchema, roleSchema } from "@secondlife/shared";
import { type NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import { signSessionToken } from "@/lib/auth/session-token";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { hasSameOrigin } from "@/lib/security/same-origin";

function getDefaultDisplayName(email?: string) {
  if (!email) {
    return "Member";
  }

  return email.split("@")[0] ?? "Member";
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSameOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid origin." },
        },
        { status: 403 },
      );
    }

    const body = establishSessionInputSchema.parse(await request.json());
    const idToken = body.idToken;

    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authenticated user is missing an email." },
        },
        { status: 400 },
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    let role: "user" | "admin" = "user";

    if (userSnapshot.exists) {
      const data = userSnapshot.data();
      const parsedRole = roleSchema.safeParse(data?.role);
      role = parsedRole.success ? parsedRole.data : "user";
    } else {
      await userRef.set({
        email,
        role: "user",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const profileRef = adminDb.collection("profiles").doc(uid);
    const profileSnapshot = await profileRef.get();

    if (!profileSnapshot.exists) {
      await profileRef.set({
        displayName: getDefaultDisplayName(email),
        bio: "",
        locationOpt: null,
        preferences: {},
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const sessionToken = await signSessionToken({
      uid,
      role,
      email,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        uid,
        role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const isValidationError =
      typeof error === "object" && error !== null && "name" in error && error.name === "ZodError";

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unable to create session.",
        },
      },
      { status: isValidationError ? 400 : 401 },
    );
  }
}

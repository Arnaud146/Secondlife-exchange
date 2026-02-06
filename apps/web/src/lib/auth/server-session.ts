import "server-only";

import { roleSchema, type AppSessionClaims } from "@secondlife/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminDb } from "@/lib/firebase/admin";

import { SESSION_COOKIE_NAME } from "./constants";
import { verifySessionToken } from "./session-token";

export async function getServerSession(): Promise<AppSessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireServerSession(): Promise<AppSessionClaims> {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return session;
}

export async function requireAdminSession(): Promise<AppSessionClaims> {
  const session = await requireServerSession();

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const userSnapshot = await adminDb.collection("users").doc(session.uid).get();
  const roleResult = roleSchema.safeParse(userSnapshot.data()?.role);

  if (!roleResult.success || roleResult.data !== "admin") {
    redirect("/dashboard");
  }

  return session;
}

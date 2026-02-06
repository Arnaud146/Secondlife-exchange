import { establishSessionInputSchema } from "@secondlife/shared";

export async function establishServerSession(idToken: string): Promise<{ role: "user" | "admin" }> {
  const payload = establishSessionInputSchema.parse({ idToken });

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as {
    success: boolean;
    error?: { message?: string };
    data?: { role: "user" | "admin" };
  };

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error?.message ?? "Failed to establish server session.");
  }

  return result.data;
}

export async function clearServerSession(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
  });
}

"use client";

import { type User, onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase/client";

type FunctionMethod = "GET" | "POST";

type CallFunctionOptions = {
  method?: FunctionMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

function getFunctionsBaseUrl() {
  if (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL) {
    const raw = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL.replace(/\/$/, "");
    // Ensure the URL always has a protocol so fetch() and new URL() work correctly
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      return `https://${raw}`;
    }
    return raw;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required.");
  }

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    return `http://127.0.0.1:5001/${projectId}/europe-west1`;
  }

  return `https://europe-west1-${projectId}.cloudfunctions.net`;
}

function withQuery(
  url: string,
  query?: Record<string, string | number | boolean | undefined | null>,
) {
  if (!query) {
    return url;
  }

  const parsedUrl = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    parsedUrl.searchParams.set(key, String(value));
  }

  return parsedUrl.toString();
}

async function waitForUser(timeoutMs = 3500): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function callFunction<TData>(
  functionName: string,
  options: CallFunctionOptions = {},
): Promise<TData> {
  const user = await waitForUser();
  if (!user) {
    throw new Error("You must be authenticated to call this endpoint.");
  }

  const idToken = await user.getIdToken();
  const method = options.method ?? "GET";
  const url = withQuery(`${getFunctionsBaseUrl()}/${functionName}`, options.query);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    data?: TData;
    error?: { message?: string };
  };

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error?.message ?? `Function ${functionName} failed.`);
  }

  return payload.data;
}

"use client";

import { signInInputSchema, signUpInputSchema } from "@secondlife/shared";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { establishServerSession } from "@/lib/auth/client-session";
import { auth } from "@/lib/firebase/client";

import { Button } from "../ui/button";

type AuthMode = "signin" | "signup";

type FormState = {
  email: string;
  password: string;
  displayName: string;
  confirmPassword: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Authentication failed.";
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") ?? "/dashboard", [searchParams]);

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    displayName: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signup";
  const submitLabel = isSignUp ? "Create account" : "Sign in";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const parsed = signUpInputSchema.parse(form);
        const credential = await createUserWithEmailAndPassword(
          auth,
          parsed.email,
          parsed.password,
        );
        await updateProfile(credential.user, { displayName: parsed.displayName });

        const idToken = await credential.user.getIdToken(true);
        await establishServerSession(idToken);
      } else {
        const parsed = signInInputSchema.parse({
          email: form.email,
          password: form.password,
        });
        const credential = await signInWithEmailAndPassword(auth, parsed.email, parsed.password);
        const idToken = await credential.user.getIdToken(true);
        await establishServerSession(idToken);
      }

      const safeRedirect = nextPath.startsWith("/") ? nextPath : "/dashboard";
      router.replace(safeRedirect);
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {isSignUp ? (
        <>
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              required
              value={form.displayName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, displayName: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </>
      ) : null}

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Please wait..." : submitLabel}
      </Button>

      <p className="text-sm text-muted-foreground">
        {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={isSignUp ? "/auth/signin" : "/auth/signup"}
          className="font-semibold text-primary hover:underline"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}

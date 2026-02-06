import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <section className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your SecondLife dashboard.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-in form...</p>}>
        <AuthForm mode="signin" />
      </Suspense>
    </section>
  );
}

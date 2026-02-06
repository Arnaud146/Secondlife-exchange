import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <section className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Join the exchange and start sharing second-hand objects.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-up form...</p>}>
        <AuthForm mode="signup" />
      </Suspense>
    </section>
  );
}

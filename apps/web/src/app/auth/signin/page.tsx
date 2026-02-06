import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <section className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold">Bon retour</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre tableau de bord SecondLife.
        </p>
      </header>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Chargement du formulaire de connexion...</p>
        }
      >
        <AuthForm mode="signin" />
      </Suspense>
    </section>
  );
}

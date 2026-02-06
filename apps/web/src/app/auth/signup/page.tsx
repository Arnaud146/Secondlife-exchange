import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <section className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold">Créez votre compte</h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez l'échange et commencez à partager des objets de seconde main.
        </p>
      </header>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Chargement du formulaire d'inscription...</p>
        }
      >
        <AuthForm mode="signup" />
      </Suspense>
    </section>
  );
}

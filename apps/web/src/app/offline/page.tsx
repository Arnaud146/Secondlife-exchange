import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6 py-10">
      <div className="space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="font-heading text-3xl font-bold">Mode hors ligne</h1>
        <p className="text-muted-foreground">
          Les pages en cache sont disponibles. Reconnectez-vous pour actualiser les données et
          soumettre de nouvelles actions.
        </p>
        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </main>
  );
}

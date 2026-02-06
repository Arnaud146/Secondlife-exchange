import { EcoDiscover } from "@/components/eco/eco-discover";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function EcoDiscoverPage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Découverte éco</h1>
        <p className="text-sm text-muted-foreground">
          Explorez des articles, vidéos et statistiques en lien avec les thèmes hebdomadaires et les
          habitudes à faible impact.
        </p>
      </header>
      <EcoDiscover />
    </main>
  );
}

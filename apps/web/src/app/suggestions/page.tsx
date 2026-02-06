import { SuggestionsFeed } from "@/components/suggestions/suggestions-feed";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function SuggestionsPage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Suggestions de la semaine</h1>
        <p className="text-sm text-muted-foreground">
          Suggestions IA sélectionnées et publiées en lien avec le thème communautaire actif.
        </p>
      </header>
      <SuggestionsFeed />
    </main>
  );
}

import { SuggestionsFeed } from "@/components/suggestions/suggestions-feed";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function SuggestionsPage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Suggestions of the week</h1>
        <p className="text-sm text-muted-foreground">
          Curated and published AI suggestions matched to the active community theme.
        </p>
      </header>
      <SuggestionsFeed />
    </main>
  );
}

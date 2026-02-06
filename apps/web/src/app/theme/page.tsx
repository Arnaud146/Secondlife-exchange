import { ThemeExplorer } from "@/components/themes/theme-explorer";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function ThemePage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Thèmes hebdomadaires</h1>
        <p className="text-sm text-muted-foreground">
          Découvrez le thème actuel et explorez les semaines thématiques passées ou à venir.
        </p>
      </header>
      <ThemeExplorer />
    </main>
  );
}

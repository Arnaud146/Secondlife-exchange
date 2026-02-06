import { ThemeExplorer } from "@/components/themes/theme-explorer";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function ThemePage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Weekly themes</h1>
        <p className="text-sm text-muted-foreground">
          Discover the current theme and explore previous or scheduled theme weeks.
        </p>
      </header>
      <ThemeExplorer />
    </main>
  );
}

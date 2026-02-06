"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getCurrentThemeWeek, listThemeWeeks, type ThemeWeekSummary } from "@/lib/themes/client";

function toDateSafe(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    const date = new Date((value as { seconds: number }).seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function formatRange(theme: ThemeWeekSummary) {
  const start = toDateSafe(theme.weekStart);
  const end = toDateSafe(theme.weekEnd);

  if (!start || !end) {
    return "Période inconnue";
  }

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function ThemeCard({ theme, highlight = false }: { theme: ThemeWeekSummary; highlight?: boolean }) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight ? "border-primary/40 bg-primary/5" : "bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-xl font-bold">{theme.title}</h3>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
          {theme.themeSlug}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{formatRange(theme)}</p>
      <p className="mt-3 text-sm">{theme.ecoImpactSummary}</p>
    </article>
  );
}

export function ThemeExplorer() {
  const [currentTheme, setCurrentTheme] = useState<ThemeWeekSummary | null>(null);
  const [themes, setThemes] = useState<ThemeWeekSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [current, listed] = await Promise.all([
        getCurrentThemeWeek(),
        listThemeWeeks({
          limit: 8,
        }),
      ]);

      setCurrentTheme(current.currentTheme);
      setThemes(listed.themeWeeks);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les thèmes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const listed = await listThemeWeeks({
        limit: 8,
        cursor: nextCursor,
      });

      setThemes((prev) => [...prev, ...listed.themeWeeks]);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les thèmes.");
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return (
    <section className="space-y-6">
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold">Thème actuel</h2>
          <Button variant="outline" onClick={() => void loadInitial()} disabled={isLoading}>
            Actualiser
          </Button>
        </div>

        {currentTheme ? (
          <ThemeCard theme={currentTheme} highlight />
        ) : (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Aucun thème de la semaine actif actuellement.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-bold">Archives des thèmes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {themes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>

        {themes.length === 0 && !isLoading ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Aucun thème hebdomadaire disponible pour le moment.
          </p>
        ) : null}

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => void loadMore()}
            disabled={isLoading || !nextCursor}
            className="min-w-40"
          >
            {isLoading ? "Chargement..." : nextCursor ? "Charger plus" : "Plus de thèmes"}
          </Button>
        </div>
      </section>
    </section>
  );
}

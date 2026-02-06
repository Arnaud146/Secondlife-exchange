"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createThemeWeek, listThemeWeeks, type ThemeWeekSummary } from "@/lib/themes/client";

type ThemeFormState = {
  title: string;
  themeSlug: string;
  weekStartLocal: string;
  weekEndLocal: string;
  ecoImpactSummary: string;
};

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
    return "Unknown range";
  }

  return `${start.toLocaleString()} -> ${end.toLocaleString()}`;
}

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminThemeManager() {
  const [formState, setFormState] = useState<ThemeFormState>({
    title: "",
    themeSlug: "",
    weekStartLocal: "",
    weekEndLocal: "",
    ecoImpactSummary: "",
  });
  const [themes, setThemes] = useState<ThemeWeekSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInitialThemes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listThemeWeeks({
        limit: 10,
        cursor: undefined,
      });

      setThemes(response.themeWeeks);
      setNextCursor(response.nextCursor);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load theme weeks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreThemes = useCallback(async () => {
    if (!nextCursor) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listThemeWeeks({
        limit: 10,
        cursor: nextCursor,
      });

      setThemes((prev) => [...prev, ...response.themeWeeks]);
      setNextCursor(response.nextCursor);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load theme weeks.");
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    void loadInitialThemes();
  }, [loadInitialThemes]);

  async function onCreateTheme() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const weekStartIso = new Date(formState.weekStartLocal).toISOString();
      const weekEndIso = new Date(formState.weekEndLocal).toISOString();

      const payload = {
        weekStartIso,
        weekEndIso,
        themeSlug: normalizeSlug(formState.themeSlug),
        title: formState.title.trim(),
        ecoImpactSummary: formState.ecoImpactSummary.trim(),
      };

      const result = await createThemeWeek(payload);
      setSuccessMessage(`Theme week created: ${result.themeWeekId}`);

      setFormState((prev) => ({
        ...prev,
        title: "",
        themeSlug: "",
        ecoImpactSummary: "",
      }));

      await loadInitialThemes();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create theme week.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-xl font-bold">Create / schedule theme week</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="themeTitle" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="themeTitle"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="themeSlug" className="block text-sm font-medium">
              Slug (lowercase with hyphens)
            </label>
            <input
              id="themeSlug"
              value={formState.themeSlug}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, themeSlug: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="weekStartLocal" className="block text-sm font-medium">
              Week start
            </label>
            <input
              id="weekStartLocal"
              type="datetime-local"
              value={formState.weekStartLocal}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, weekStartLocal: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="weekEndLocal" className="block text-sm font-medium">
              Week end
            </label>
            <input
              id="weekEndLocal"
              type="datetime-local"
              value={formState.weekEndLocal}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, weekEndLocal: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="ecoImpactSummary" className="block text-sm font-medium">
            Eco impact summary
          </label>
          <textarea
            id="ecoImpactSummary"
            rows={4}
            value={formState.ecoImpactSummary}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, ecoImpactSummary: event.target.value }))
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}

        <Button onClick={() => void onCreateTheme()} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create theme week"}
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">Scheduled and past themes</h2>
          <Button variant="outline" onClick={() => void loadInitialThemes()} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {themes.map((theme) => (
            <article key={theme.id} className="rounded-xl border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-bold">{theme.title}</h3>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                  {theme.themeSlug}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatRange(theme)}</p>
              <p className="mt-2 text-sm">{theme.ecoImpactSummary}</p>
            </article>
          ))}
        </div>

        {themes.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">No theme weeks found.</p>
        ) : null}

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => void loadMoreThemes()}
            disabled={isLoading || !nextCursor}
            className="min-w-40"
          >
            {isLoading ? "Loading..." : nextCursor ? "Load more" : "No more themes"}
          </Button>
        </div>
      </section>
    </section>
  );
}

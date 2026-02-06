"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { listPublishedAiSuggestions, type SuggestionSummary } from "@/lib/suggestions/client";
import { getCurrentThemeWeek } from "@/lib/themes/client";

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

function SuggestionCard({ suggestion }: { suggestion: SuggestionSummary }) {
  const createdAt = toDateSafe(suggestion.createdAt);
  const activeFlags = Object.entries(suggestion.diversityFlags)
    .filter((entry) => entry[1])
    .map((entry) => entry[0]);

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="font-heading text-xl font-bold">{suggestion.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{suggestion.rationale}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestion.tags.map((tag) => (
          <span
            key={`${suggestion.id}-tag-${tag}`}
            className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestion.categoryHints.map((categoryHint) => (
          <span
            key={`${suggestion.id}-category-${categoryHint}`}
            className="rounded-md border px-2 py-1 text-xs font-medium"
          >
            {categoryHint}
          </span>
        ))}
      </div>

      {activeFlags.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Diversity flags: {activeFlags.join(", ")}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {createdAt
          ? `Published suggestion prepared on ${createdAt.toLocaleDateString()}`
          : "Date unavailable"}
      </p>
    </article>
  );
}

export function SuggestionsFeed() {
  const [themeWeekIdFilter, setThemeWeekIdFilter] = useState<string | undefined>(undefined);
  const [themeTitle, setThemeTitle] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const listQuery = useMemo(
    () => ({
      limit: 8,
      themeWeekId: themeWeekIdFilter,
    }),
    [themeWeekIdFilter],
  );

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const currentThemeResult = await getCurrentThemeWeek();
      const currentTheme = currentThemeResult.currentTheme;
      const nextThemeWeekIdFilter = currentTheme?.id;

      setThemeWeekIdFilter(nextThemeWeekIdFilter);
      setThemeTitle(currentTheme?.title ?? null);

      const listed = await listPublishedAiSuggestions({
        limit: 8,
        themeWeekId: nextThemeWeekIdFilter,
      });

      setSuggestions(listed.suggestions);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load weekly suggestions.",
      );
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
      const listed = await listPublishedAiSuggestions({
        ...listQuery,
        cursor: nextCursor,
      });

      setSuggestions((prev) => [...prev, ...listed.suggestions]);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load weekly suggestions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [listQuery, nextCursor]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">Scope</p>
          <p className="font-medium">
            {themeTitle ? `Current theme: ${themeTitle}` : "Latest published suggestions"}
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadInitial()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      {suggestions.length === 0 && !isLoading ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No published suggestions available yet.
        </p>
      ) : null}

      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={() => void loadMore()}
          disabled={isLoading || !nextCursor}
          className="min-w-40"
        >
          {isLoading ? "Loading..." : nextCursor ? "Load more" : "No more suggestions"}
        </Button>
      </div>
    </section>
  );
}

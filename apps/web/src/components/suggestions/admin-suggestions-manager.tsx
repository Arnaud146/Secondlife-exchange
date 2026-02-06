"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  adminGenerateWeeklySuggestions,
  approveAiSuggestion,
  deleteAiSuggestion,
  listPendingAiSuggestions,
  type SuggestionSummary,
} from "@/lib/suggestions/client";

type GenerateFormState = {
  desiredCount: string;
  language: string;
  force: boolean;
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

function PendingSuggestionCard({
  suggestion,
  onApprove,
  onDelete,
  isMutating,
}: {
  suggestion: SuggestionSummary;
  onApprove: (suggestionId: string) => Promise<void>;
  onDelete: (suggestionId: string) => Promise<void>;
  isMutating: boolean;
}) {
  const createdAt = toDateSafe(suggestion.createdAt);

  return (
    <article className="space-y-3 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-xl font-bold">{suggestion.title}</h3>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
          {suggestion.themeWeekId}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
      <p className="text-xs text-muted-foreground">
        {createdAt ? `Created on ${createdAt.toLocaleString()}` : "Created date unavailable"}
      </p>

      <div className="flex flex-wrap gap-2">
        {suggestion.tags.map((tag) => (
          <span
            key={`${suggestion.id}-tag-${tag}`}
            className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestion.categoryHints.map((categoryHint) => (
          <span
            key={`${suggestion.id}-category-${categoryHint}`}
            className="rounded-md border px-2 py-1 text-xs font-medium"
          >
            {categoryHint}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void onApprove(suggestion.id)} disabled={isMutating}>
          Approve and publish
        </Button>
        <Button
          variant="destructive"
          onClick={() => void onDelete(suggestion.id)}
          disabled={isMutating}
        >
          Reject and delete
        </Button>
      </div>
    </article>
  );
}

export function AdminSuggestionsManager() {
  const [generateState, setGenerateState] = useState<GenerateFormState>({
    desiredCount: "8",
    language: "fr",
    force: false,
  });
  const [pendingSuggestions, setPendingSuggestions] = useState<SuggestionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const listQuery = useMemo(
    () => ({
      limit: 12,
    }),
    [],
  );

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const listed = await listPendingAiSuggestions(listQuery);
      setPendingSuggestions(listed.suggestions);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load pending suggestions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [listQuery]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const listed = await listPendingAiSuggestions({
        ...listQuery,
        cursor: nextCursor,
      });
      setPendingSuggestions((prev) => [...prev, ...listed.suggestions]);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load pending suggestions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [listQuery, nextCursor]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function onGenerate() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsMutating(true);

    try {
      const desiredCount = Number(generateState.desiredCount);
      const response = await adminGenerateWeeklySuggestions({
        force: generateState.force,
        desiredCount,
        language: generateState.language,
      });
      setSuccessMessage(
        `Generation status: ${response.status}. generated=${response.generatedCount}, existing=${response.existingCount}`,
      );
      await loadInitial();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate weekly suggestions.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function onApprove(suggestionId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsMutating(true);

    try {
      await approveAiSuggestion(suggestionId);
      setPendingSuggestions((prev) => prev.filter((entry) => entry.id !== suggestionId));
      setSuccessMessage(`Suggestion ${suggestionId} published.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to approve suggestion.");
    } finally {
      setIsMutating(false);
    }
  }

  async function onDelete(suggestionId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsMutating(true);

    try {
      await deleteAiSuggestion(suggestionId);
      setPendingSuggestions((prev) => prev.filter((entry) => entry.id !== suggestionId));
      setSuccessMessage(`Suggestion ${suggestionId} deleted.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete suggestion.");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-xl font-bold">Generate weekly suggestions</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="desiredCount" className="block text-sm font-medium">
              Desired count
            </label>
            <input
              id="desiredCount"
              type="number"
              min={3}
              max={20}
              value={generateState.desiredCount}
              onChange={(event) =>
                setGenerateState((prev) => ({ ...prev, desiredCount: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="language" className="block text-sm font-medium">
              Language
            </label>
            <input
              id="language"
              value={generateState.language}
              onChange={(event) =>
                setGenerateState((prev) => ({ ...prev, language: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <label className="mt-8 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={generateState.force}
              onChange={(event) =>
                setGenerateState((prev) => ({ ...prev, force: event.target.checked }))
              }
            />
            Force generation even if suggestions already exist
          </label>
        </div>

        <Button onClick={() => void onGenerate()} disabled={isMutating}>
          {isMutating ? "Running..." : "Generate now"}
        </Button>
      </section>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">Pending suggestions for moderation</h2>
          <Button variant="outline" onClick={() => void loadInitial()} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-4">
          {pendingSuggestions.map((suggestion) => (
            <PendingSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApprove={onApprove}
              onDelete={onDelete}
              isMutating={isMutating}
            />
          ))}
        </div>

        {pendingSuggestions.length === 0 && !isLoading ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            No pending suggestions. Use generation to create a new review batch.
          </p>
        ) : null}

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => void loadMore()}
            disabled={isLoading || !nextCursor}
            className="min-w-40"
          >
            {isLoading ? "Loading..." : nextCursor ? "Load more" : "No more pending"}
          </Button>
        </div>
      </section>
    </section>
  );
}

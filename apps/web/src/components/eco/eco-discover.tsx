"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type EcoContentType } from "@secondlife/shared";

import { Button } from "@/components/ui/button";
import { listEcoContents, type EcoContentSummary } from "@/lib/eco/client";
import { getCurrentThemeWeek, listThemeWeeks } from "@/lib/themes/client";

type EcoFilterState = {
  type: EcoContentType | "all";
  tag: string;
  themeWeekId: string;
  lang: string;
};

type ThemeOption = {
  id: string;
  title: string;
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

function summarizeDate(value: unknown): string {
  const date = toDateSafe(value);
  return date ? date.toLocaleDateString() : "Date inconnue";
}

function EcoContentCard({ content }: { content: EcoContentSummary }) {
  return (
    <article className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
          {content.type}
        </span>
        <span className="text-xs text-muted-foreground">{summarizeDate(content.publishedAt)}</span>
      </div>

      <h3 className="font-heading text-xl font-bold">{content.title}</h3>
      <p className="text-sm text-muted-foreground">{content.summary}</p>

      <div className="flex flex-wrap gap-2">
        {content.tags.map((tag) => (
          <span
            key={`${content.id}-tag-${tag}`}
            className="rounded-full border px-2 py-1 text-xs font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">{content.lang.toUpperCase()}</span>
        <Button variant="outline" asChild>
          <Link href={`/eco-discover/${content.id}`}>Lire le détail</Link>
        </Button>
      </div>
    </article>
  );
}

export function EcoDiscover() {
  const [filters, setFilters] = useState<EcoFilterState>({
    type: "all",
    tag: "",
    themeWeekId: "",
    lang: "",
  });
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
  const [ecoContents, setEcoContents] = useState<EcoContentSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const baseQuery = useMemo(
    () => ({
      limit: 8,
      type: filters.type === "all" ? undefined : filters.type,
      tag: filters.tag.trim() || undefined,
      themeWeekId: filters.themeWeekId || undefined,
      lang: filters.lang.trim() || undefined,
    }),
    [filters.lang, filters.tag, filters.themeWeekId, filters.type],
  );

  const loadThemeOptions = useCallback(async () => {
    try {
      const [currentTheme, themeWeeks] = await Promise.all([
        getCurrentThemeWeek(),
        listThemeWeeks({
          limit: 12,
        }),
      ]);

      const combined = [
        ...(currentTheme.currentTheme ? [currentTheme.currentTheme] : []),
        ...themeWeeks.themeWeeks,
      ];

      const uniqueById = new Map<string, ThemeOption>();
      for (const themeWeek of combined) {
        uniqueById.set(themeWeek.id, {
          id: themeWeek.id,
          title: themeWeek.title,
        });
      }

      setThemeOptions(Array.from(uniqueById.values()));
    } catch {
      setThemeOptions([]);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const listed = await listEcoContents(baseQuery);
      setEcoContents(listed.ecoContents);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger la découverte éco.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [baseQuery]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const listed = await listEcoContents({
        ...baseQuery,
        cursor: nextCursor,
      });

      setEcoContents((prev) => [...prev, ...listed.ecoContents]);
      setNextCursor(listed.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger la découverte éco.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [baseQuery, nextCursor]);

  useEffect(() => {
    void loadThemeOptions();
  }, [loadThemeOptions]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return (
    <section className="space-y-6">
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-xl font-bold">Filtres</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="ecoType" className="text-sm font-medium">
              Type
            </label>
            <select
              id="ecoType"
              value={filters.type}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  type: event.target.value as EcoFilterState["type"],
                }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Tous</option>
              <option value="article">Article</option>
              <option value="video">Vidéo</option>
              <option value="stat">Statistique</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ecoTag" className="text-sm font-medium">
              Tag
            </label>
            <input
              id="ecoTag"
              value={filters.tag}
              onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="réparation"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ecoTheme" className="text-sm font-medium">
              Thème
            </label>
            <select
              id="ecoTheme"
              value={filters.themeWeekId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, themeWeekId: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Tous les thèmes</option>
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ecoLang" className="text-sm font-medium">
              Langue
            </label>
            <input
              id="ecoLang"
              value={filters.lang}
              onChange={(event) => setFilters((prev) => ({ ...prev, lang: event.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="fr"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadInitial()} disabled={isLoading}>
            Appliquer les filtres
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({
                type: "all",
                tag: "",
                themeWeekId: "",
                lang: "",
              });
            }}
            disabled={isLoading}
          >
            Réinitialiser
          </Button>
        </div>
      </section>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <section className="grid gap-4 md:grid-cols-2">
        {ecoContents.map((content) => (
          <EcoContentCard key={content.id} content={content} />
        ))}
      </section>

      {ecoContents.length === 0 && !isLoading ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Aucun contenu éco disponible pour ces filtres.
        </p>
      ) : null}

      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={() => void loadMore()}
          disabled={isLoading || !nextCursor}
          className="min-w-40"
        >
          {isLoading ? "Chargement..." : nextCursor ? "Charger plus" : "Plus de résultats"}
        </Button>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type EcoContentType } from "@secondlife/shared";

import { Button } from "@/components/ui/button";
import {
  adminCreateEcoContent,
  adminListEcoContents,
  type EcoContentSummary,
} from "@/lib/eco/client";
import { listThemeWeeks } from "@/lib/themes/client";

type EcoFormState = {
  type: EcoContentType;
  title: string;
  summary: string;
  sourceUrl: string;
  tagsRaw: string;
  lang: string;
  themeWeekId: string;
  publishedAtLocal: string;
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

function formatDate(value: unknown) {
  const date = toDateSafe(value);
  return date ? date.toLocaleString() : "Inconnu";
}

export function AdminEcoManager() {
  const [formState, setFormState] = useState<EcoFormState>({
    type: "article",
    title: "",
    summary: "",
    sourceUrl: "",
    tagsRaw: "",
    lang: "fr",
    themeWeekId: "",
    publishedAtLocal: "",
  });
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
  const [ecoContents, setEcoContents] = useState<EcoContentSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const listQuery = useMemo(
    () => ({
      limit: 12,
    }),
    [],
  );

  const loadThemeOptions = useCallback(async () => {
    try {
      const response = await listThemeWeeks({
        limit: 20,
      });
      setThemeOptions(
        response.themeWeeks.map((theme) => ({
          id: theme.id,
          title: theme.title,
        })),
      );
    } catch {
      setThemeOptions([]);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await adminListEcoContents(listQuery);
      setEcoContents(response.ecoContents);
      setNextCursor(response.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les contenus éco.",
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
      const response = await adminListEcoContents({
        ...listQuery,
        cursor: nextCursor,
      });
      setEcoContents((prev) => [...prev, ...response.ecoContents]);
      setNextCursor(response.nextCursor);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les contenus éco.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [listQuery, nextCursor]);

  useEffect(() => {
    void loadThemeOptions();
    void loadInitial();
  }, [loadInitial, loadThemeOptions]);

  async function onCreate() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const tags = formState.tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const payload = {
        type: formState.type,
        title: formState.title.trim(),
        summary: formState.summary.trim(),
        sourceUrl: formState.sourceUrl.trim(),
        tags,
        lang: formState.lang.trim(),
        themeWeekId: formState.themeWeekId ? formState.themeWeekId : null,
        publishedAtIso: formState.publishedAtLocal
          ? new Date(formState.publishedAtLocal).toISOString()
          : undefined,
      };

      const response = await adminCreateEcoContent(payload);
      setSuccessMessage(`Contenu éco créé : ${response.contentId}`);
      setFormState((prev) => ({
        ...prev,
        title: "",
        summary: "",
        sourceUrl: "",
        tagsRaw: "",
      }));
      await loadInitial();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de créer le contenu éco.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-xl font-bold">Créer du contenu éco</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ecoType" className="text-sm font-medium">
              Type
            </label>
            <select
              id="ecoType"
              value={formState.type}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  type: event.target.value as EcoContentType,
                }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="article">Article</option>
              <option value="video">Vidéo</option>
              <option value="stat">Statistique</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ecoThemeWeek" className="text-sm font-medium">
              Thème de la semaine
            </label>
            <select
              id="ecoThemeWeek"
              value={formState.themeWeekId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, themeWeekId: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Aucun</option>
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="ecoTitle" className="text-sm font-medium">
            Titre
          </label>
          <input
            id="ecoTitle"
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ecoSummary" className="text-sm font-medium">
            Résumé
          </label>
          <textarea
            id="ecoSummary"
            rows={4}
            value={formState.summary}
            onChange={(event) => setFormState((prev) => ({ ...prev, summary: event.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ecoSourceUrl" className="text-sm font-medium">
              URL de la source
            </label>
            <input
              id="ecoSourceUrl"
              value={formState.sourceUrl}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, sourceUrl: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="https://example.org/resource"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ecoTags" className="text-sm font-medium">
              Tags (séparés par des virgules)
            </label>
            <input
              id="ecoTags"
              value={formState.tagsRaw}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, tagsRaw: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="réparation, réutilisation"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ecoLang" className="text-sm font-medium">
              Langue
            </label>
            <input
              id="ecoLang"
              value={formState.lang}
              onChange={(event) => setFormState((prev) => ({ ...prev, lang: event.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="fr"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ecoPublishedAt" className="text-sm font-medium">
              Date de publication (optionnel)
            </label>
            <input
              id="ecoPublishedAt"
              type="datetime-local"
              value={formState.publishedAtLocal}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, publishedAtLocal: event.target.value }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}

        <Button onClick={() => void onCreate()} disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer le contenu éco"}
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">Contenus éco récents</h2>
          <Button variant="outline" onClick={() => void loadInitial()} disabled={isLoading}>
            Actualiser
          </Button>
        </div>

        <div className="grid gap-4">
          {ecoContents.map((content) => (
            <article key={content.id} className="rounded-xl border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-bold">{content.title}</h3>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                  {content.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{content.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Publié le : {formatDate(content.publishedAt)} | Créé le :{" "}
                {formatDate(content.createdAt)}
              </p>
            </article>
          ))}
        </div>

        {ecoContents.length === 0 && !isLoading ? (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            Aucun contenu éco trouvé.
          </p>
        ) : null}

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => void loadMore()}
            disabled={isLoading || !nextCursor}
            className="min-w-40"
          >
            {isLoading ? "Chargement..." : nextCursor ? "Charger plus" : "Plus d'entrées"}
          </Button>
        </div>
      </section>
    </section>
  );
}

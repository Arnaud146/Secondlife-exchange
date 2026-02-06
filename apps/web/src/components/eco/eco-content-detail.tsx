"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getEcoContentDetail, trackEcoView, type EcoContentSummary } from "@/lib/eco/client";

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

function formatDate(value: unknown): string {
  const date = toDateSafe(value);
  return date ? date.toLocaleString() : "Unknown";
}

export function EcoContentDetail({ contentId }: { contentId: string }) {
  const [content, setContent] = useState<EcoContentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getEcoContentDetail(contentId);
        if (!isMounted) {
          return;
        }

        setContent(response.ecoContent);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Unable to load eco content.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [contentId]);

  useEffect(() => {
    if (!content || hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;
    void trackEcoView({
      contentId: content.id,
      themeWeekId: content.themeWeekId ?? null,
    });
  }, [content]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading eco content...</p>;
  }

  if (errorMessage || !content) {
    return <p className="text-sm text-destructive">{errorMessage ?? "Eco content not found."}</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
            {content.type}
          </span>
          <span className="text-xs text-muted-foreground">
            Published: {formatDate(content.publishedAt)}
          </span>
        </div>

        <h1 className="font-heading text-3xl font-bold">{content.title}</h1>
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
      </header>

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-xl font-bold">Source</h2>
        <p className="text-sm text-muted-foreground">Language: {content.lang.toUpperCase()}</p>
        <Button asChild>
          <Link href={content.sourceUrl} target="_blank" rel="noreferrer noopener">
            Open source
          </Link>
        </Button>
      </section>
    </section>
  );
}

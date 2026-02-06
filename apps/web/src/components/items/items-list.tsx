"use client";

import { itemStatusSchema } from "@secondlife/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { listItems, type ItemSummary } from "@/lib/items/client";

function formatCreatedAt(value: unknown) {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }

  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = (value as { seconds?: number }).seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000).toLocaleDateString();
    }
  }

  return "Unknown";
}

export function ItemsList() {
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof itemStatusSchema.options)[number]>("active");
  const [mineOnly, setMineOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadItems = useCallback(
    async (params: { reset: boolean; cursorValue?: string | null }) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listItems({
          limit: 9,
          cursor: params.reset ? undefined : (params.cursorValue ?? undefined),
          status,
          mine: mineOnly,
        });

        setItems((prev) => (params.reset ? response.items : [...prev, ...response.items]));
        setCursor(response.nextCursor);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load items.");
      } finally {
        setIsLoading(false);
      }
    },
    [mineOnly, status],
  );

  useEffect(() => {
    void loadItems({ reset: true });
  }, [loadItems, mineOnly, status]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <label htmlFor="statusFilter" className="block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="statusFilter"
            value={status}
            onChange={(event) => setStatus(itemStatusSchema.parse(event.target.value))}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {itemStatusSchema.options.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(event) => setMineOnly(event.target.checked)}
            className="h-4 w-4 rounded border"
          />
          My items only
        </label>

        <Button
          variant="outline"
          onClick={() => void loadItems({ reset: true })}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-lg font-bold">{item.title}</h3>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
                {item.status}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
            <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>
                <dt className="inline font-semibold text-foreground">Category:</dt>{" "}
                <dd className="inline">{item.category}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-foreground">State:</dt>{" "}
                <dd className="inline">{item.state}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-foreground">Media:</dt>{" "}
                <dd className="inline">{item.mediaCount}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-foreground">Created:</dt>{" "}
                <dd className="inline">{formatCreatedAt(item.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href={`/items/${item.id}`}>View</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/items/${item.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && !isLoading ? (
        <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          No items found for current filters.
        </p>
      ) : null}

      <div className="flex justify-center">
        <Button
          onClick={() => void loadItems({ reset: false, cursorValue: cursor })}
          disabled={isLoading || !cursor}
          variant="secondary"
          className="min-w-40"
        >
          {isLoading ? "Loading..." : cursor ? "Load more" : "No more items"}
        </Button>
      </div>
    </section>
  );
}

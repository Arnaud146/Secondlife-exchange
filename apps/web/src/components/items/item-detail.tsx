"use client";

import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import { getItemDetail, type ItemDetail } from "@/lib/items/client";

function formatDate(value: unknown) {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = (value as { seconds?: number }).seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000).toLocaleString();
    }
  }

  return "Unknown";
}

export function ItemDetailView({ itemId }: { itemId: string }) {
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [viewerUid, setViewerUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setViewerUid(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await getItemDetail(itemId);
        if (!isMounted) {
          return;
        }
        setDetail(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Unable to load item.");
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
  }, [itemId]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading item...</p>;
  }

  if (errorMessage || !detail) {
    return <p className="text-sm text-destructive">{errorMessage ?? "Item not found."}</p>;
  }

  const canEdit = viewerUid === detail.item.ownerId;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-5">
        <div>
          <h1 className="font-heading text-3xl font-bold">{detail.item.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{detail.item.description}</p>
        </div>
        {canEdit ? (
          <Button asChild>
            <Link href={`/items/${detail.item.id}/edit`}>Edit item</Link>
          </Button>
        ) : null}
      </header>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
        <article>
          <h2 className="font-heading text-lg font-bold">Details</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div>
              <dt className="inline font-semibold">Category:</dt>{" "}
              <dd className="inline">{detail.item.category}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">State:</dt>{" "}
              <dd className="inline">{detail.item.state}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Status:</dt>{" "}
              <dd className="inline">{detail.item.status}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Owner:</dt>{" "}
              <dd className="inline">{detail.item.ownerId}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Created:</dt>{" "}
              <dd className="inline">{formatDate(detail.item.createdAt)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Updated:</dt>{" "}
              <dd className="inline">{formatDate(detail.item.updatedAt)}</dd>
            </div>
          </dl>
        </article>
        <article>
          <h2 className="font-heading text-lg font-bold">Media</h2>
          <p className="mt-3 text-sm text-muted-foreground">{detail.media.length} image(s)</p>
        </article>
      </section>

      <section>
        <h2 className="font-heading mb-3 text-xl font-bold">Photos</h2>
        {detail.media.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            No photos uploaded yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detail.media.map((media) => (
              <figure key={media.id} className="overflow-hidden rounded-xl border bg-card">
                <div className="relative h-52 w-full">
                  <Image
                    src={media.url}
                    alt={`Item media ${media.id}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
              </figure>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

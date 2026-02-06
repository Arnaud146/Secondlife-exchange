"use client";

import {
  MAX_ITEM_MEDIA_COUNT,
  itemImageMimeTypeSchema,
  itemStateSchema,
  updateItemInputSchema,
} from "@secondlife/shared";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { auth, storage } from "@/lib/firebase/client";
import { addItemMedia, archiveItem, getItemDetail, updateItem } from "@/lib/items/client";
import { validateItemImageFiles } from "@/lib/items/file-validation";

type EditFormState = {
  title: string;
  description: string;
  category: string;
  state: (typeof itemStateSchema.options)[number];
  themeWeekId: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export function ItemEditForm({ itemId }: { itemId: string }) {
  const router = useRouter();

  const [formState, setFormState] = useState<EditFormState>({
    title: "",
    description: "",
    category: "",
    state: "good",
    themeWeekId: "",
  });
  const [existingMediaCount, setExistingMediaCount] = useState(0);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadItem() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getItemDetail(itemId);
        if (!mounted) {
          return;
        }

        setFormState({
          title: data.item.title,
          description: data.item.description,
          category: data.item.category,
          state: itemStateSchema.parse(data.item.state),
          themeWeekId: data.item.themeWeekId ?? "",
        });
        setExistingMediaCount(data.media.length);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger l'objet.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      mounted = false;
    };
  }, [itemId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setUploadProgress(null);
    setIsSubmitting(true);

    try {
      const validatedFiles = validateItemImageFiles(newFiles);
      if (existingMediaCount + validatedFiles.length > MAX_ITEM_MEDIA_COUNT) {
        throw new Error(
          `This item already has ${existingMediaCount} media. Max is ${MAX_ITEM_MEDIA_COUNT}.`,
        );
      }

      const data = updateItemInputSchema.parse({
        title: formState.title,
        description: formState.description,
        category: formState.category,
        state: formState.state,
        themeWeekId: formState.themeWeekId.trim() ? formState.themeWeekId.trim() : null,
      });

      await updateItem({
        itemId,
        data,
      });

      if (validatedFiles.length > 0) {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Utilisateur authentifié manquant pour l'import de médias.");
        }

        for (const [index, file] of validatedFiles.entries()) {
          setUploadProgress(`Import de l'image ${index + 1}/${validatedFiles.length}...`);

          const type = itemImageMimeTypeSchema.parse(file.type);
          const storagePath = `items/${user.uid}/${itemId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
          const fileRef = ref(storage, storagePath);

          await uploadBytes(fileRef, file, {
            contentType: file.type,
            cacheControl: "public,max-age=604800",
          });

          const url = await getDownloadURL(fileRef);
          await addItemMedia({
            itemId,
            url,
            type,
          });
        }
      }

      router.replace(`/items/${itemId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de mettre à jour l'objet.",
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  async function onArchive() {
    const shouldArchive = window.confirm("Archiver cet objet ?");
    if (!shouldArchive) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await archiveItem(itemId);
      router.replace("/items");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible d'archiver l'objet.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de l'objet...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Titre
        </label>
        <input
          id="title"
          required
          value={formState.title}
          onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          required
          rows={5}
          value={formState.description}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, description: event.target.value }))
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium">
            Catégorie
          </label>
          <input
            id="category"
            required
            value={formState.category}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, category: event.target.value }))
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="state" className="block text-sm font-medium">
            État de l'objet
          </label>
          <select
            id="state"
            value={formState.state}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                state: itemStateSchema.parse(event.target.value),
              }))
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            {itemStateSchema.options.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="themeWeekId" className="block text-sm font-medium">
          Id du thème de la semaine (optionnel)
        </label>
        <input
          id="themeWeekId"
          value={formState.themeWeekId}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, themeWeekId: event.target.value }))
          }
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="photos" className="block text-sm font-medium">
          Ajouter des photos
        </label>
        <input
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => setNewFiles(Array.from(event.target.files ?? []))}
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Médias existants : {existingMediaCount} | Nouveaux fichiers : {newFiles.length}
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {uploadProgress ? <p className="text-sm text-muted-foreground">{uploadProgress}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/items/${itemId}`)}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="button" variant="destructive" onClick={onArchive} disabled={isSubmitting}>
          Archiver l'objet
        </Button>
      </div>
    </form>
  );
}

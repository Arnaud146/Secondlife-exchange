"use client";

import {
  createItemInputSchema,
  itemImageMimeTypeSchema,
  itemStateSchema,
} from "@secondlife/shared";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { auth, storage } from "@/lib/firebase/client";
import { addItemMedia, createItem } from "@/lib/items/client";
import { validateItemImageFiles } from "@/lib/items/file-validation";

type CreateItemFormState = {
  title: string;
  description: string;
  category: string;
  state: (typeof itemStateSchema.options)[number];
  themeWeekId: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export function ItemCreateForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<CreateItemFormState>({
    title: "",
    description: "",
    category: "",
    state: "good",
    themeWeekId: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setUploadProgress(null);
    setIsSubmitting(true);

    try {
      const input = createItemInputSchema.parse({
        title: formState.title,
        description: formState.description,
        category: formState.category,
        state: formState.state,
        themeWeekId: formState.themeWeekId.trim() ? formState.themeWeekId.trim() : null,
      });

      const validatedFiles = validateItemImageFiles(files);
      const { itemId } = await createItem(input);

      if (validatedFiles.length > 0) {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Missing authenticated user for media upload.");
        }

        for (const [index, file] of validatedFiles.entries()) {
          setUploadProgress(`Uploading image ${index + 1}/${validatedFiles.length}...`);

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
      setErrorMessage(error instanceof Error ? error.message : "Unable to create item.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Title
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
            Category
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
            Item state
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
          Theme week id (optional)
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
          Photos (JPEG/PNG/WEBP)
        </label>
        <input
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">{files.length} file(s) selected.</p>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {uploadProgress ? <p className="text-sm text-muted-foreground">{uploadProgress}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create item"}
      </Button>
    </form>
  );
}

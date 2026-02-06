import Link from "next/link";

import { ItemCreateForm } from "@/components/items/item-create-form";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function NewItemPage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Create item</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Publish an item and upload photos to Storage.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/items">Back to items</Link>
        </Button>
      </header>
      <ItemCreateForm />
    </main>
  );
}

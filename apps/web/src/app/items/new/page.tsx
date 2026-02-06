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
          <h1 className="font-heading text-3xl font-bold">Créer un objet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Publiez un objet et importez des photos dans le stockage.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/items">Retour aux objets</Link>
        </Button>
      </header>
      <ItemCreateForm />
    </main>
  );
}

import Link from "next/link";

import { ItemsList } from "@/components/items/items-list";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function ItemsPage() {
  await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Objets</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez, parcourez et gérez les objets d'échange avec une liste paginée.
          </p>
        </div>
        <Button asChild>
          <Link href="/items/new">Créer un objet</Link>
        </Button>
      </header>
      <ItemsList />
    </main>
  );
}

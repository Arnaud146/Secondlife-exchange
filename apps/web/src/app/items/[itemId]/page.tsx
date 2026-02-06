import Link from "next/link";

import { ItemDetailView } from "@/components/items/item-detail";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function ItemDetailPage({
  params,
}: Readonly<{
  params: Promise<{ itemId: string }>;
}>) {
  await requireServerSession();
  const { itemId } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="flex flex-wrap items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/items">Retour aux objets</Link>
        </Button>
      </header>
      <ItemDetailView itemId={itemId} />
    </main>
  );
}

import Link from "next/link";

import { ItemEditForm } from "@/components/items/item-edit-form";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function EditItemPage({
  params,
}: Readonly<{
  params: Promise<{ itemId: string }>;
}>) {
  await requireServerSession();
  const { itemId } = await params;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-12">
      <header className="flex flex-wrap items-center gap-3">
        <Button variant="outline" asChild>
          <Link href={`/items/${itemId}`}>Back to item</Link>
        </Button>
      </header>
      <ItemEditForm itemId={itemId} />
    </main>
  );
}

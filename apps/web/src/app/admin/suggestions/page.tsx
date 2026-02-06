import Link from "next/link";

import { AdminSuggestionsManager } from "@/components/suggestions/admin-suggestions-manager";
import { Button } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/server-session";

export default async function AdminSuggestionsPage() {
  await requireAdminSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin suggestions</h1>
          <p className="text-sm text-muted-foreground">
            Generate weekly AI batches and moderate publication decisions.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to admin</Link>
        </Button>
      </header>
      <AdminSuggestionsManager />
    </main>
  );
}

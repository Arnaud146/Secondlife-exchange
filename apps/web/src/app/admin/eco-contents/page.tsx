import Link from "next/link";

import { AdminEcoManager } from "@/components/eco/admin-eco-manager";
import { Button } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/server-session";

export default async function AdminEcoContentsPage() {
  await requireAdminSession();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Administration des contenus éco</h1>
          <p className="text-sm text-muted-foreground">
            Publiez des ressources écologiques et associez-les aux thèmes hebdomadaires.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Retour à l'admin</Link>
        </Button>
      </header>
      <AdminEcoManager />
    </main>
  );
}

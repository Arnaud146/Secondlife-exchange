import Link from "next/link";

import { EcoContentDetail } from "@/components/eco/eco-content-detail";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function EcoContentPage({
  params,
}: Readonly<{
  params: Promise<{ contentId: string }>;
}>) {
  await requireServerSession();
  const { contentId } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-12">
      <header>
        <Button variant="outline" asChild>
          <Link href="/eco-discover">Retour à la découverte éco</Link>
        </Button>
      </header>
      <EcoContentDetail contentId={contentId} />
    </main>
  );
}

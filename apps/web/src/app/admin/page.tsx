import Link from "next/link";

import { requireAdminSession } from "@/lib/auth/server-session";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-bold">Admin panel</h1>
      <p className="text-muted-foreground">RBAC check passed for {session.email ?? session.uid}.</p>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">Theme administration</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Plan weekly themes and manage the current editorial calendar.
        </p>
        <Link
          href="/admin/themes"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Open theme manager
        </Link>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">AI suggestions moderation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate weekly suggestion batches and approve or reject unpublished entries.
        </p>
        <Link
          href="/admin/suggestions"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Open suggestions manager
        </Link>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">Eco content management</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create articles, videos, and stats for the eco discovery experience.
        </p>
        <Link
          href="/admin/eco-contents"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Open eco manager
        </Link>
      </section>
    </main>
  );
}

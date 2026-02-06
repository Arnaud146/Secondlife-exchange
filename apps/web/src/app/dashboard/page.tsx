import { SignOutButton } from "@/components/auth/signout-button";
import { requireServerSession } from "@/lib/auth/server-session";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Signed in as {session.email ?? session.uid}</p>
        </div>
        <SignOutButton />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-lg font-bold">Session role</h2>
          <p className="mt-2 text-sm text-muted-foreground">{session.role}</p>
          {session.role === "admin" ? (
            <Link
              href="/admin"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Open admin panel
            </Link>
          ) : null}
        </article>
        <article className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-lg font-bold">Admin area</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Access is protected by middleware and server checks.
          </p>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">My items</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage item listings, upload photos, and archive entries.
          </p>
          <Link
            href="/items"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Open items workspace
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">Weekly themes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse active and upcoming themes used across the exchange.
          </p>
          <Link
            href="/theme"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Open themes page
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">AI suggestions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore admin-published weekly suggestions curated from AI generation batches.
          </p>
          <Link
            href="/suggestions"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Open suggestions page
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">Eco discovery</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse practical ecological content with filters by type, tag, language, and theme.
          </p>
          <Link
            href="/eco-discover"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Open eco discovery
          </Link>
        </article>
      </section>
    </main>
  );
}

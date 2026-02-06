import { roleSchema } from "@secondlife/shared";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const modules = [
  "Auth + profiles",
  "Items + media",
  "Weekly themes",
  "AI suggestions moderated by admin",
  "Eco discovery",
];

export default function HomePage() {
  const roles = roleSchema.options.join(" / ");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <header className="mb-16 space-y-6">
        <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
          SecondLife Exchange
        </span>
        <h1 className="font-heading text-4xl font-black tracking-tight text-foreground md:text-6xl">
          Exchange without cash, extend object lifetime.
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Monorepo initialized with Next.js App Router, Firebase, shared Zod schemas, and security
          baseline.
        </p>
        <p className="text-sm text-muted-foreground">RBAC roles: {roles}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/items">Items</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/theme">Themes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/suggestions">Suggestions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/eco-discover">Eco discover</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/auth/signup">Create account</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/offline">Offline page</Link>
          </Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {modules.map((feature) => (
          <article
            key={feature}
            className="rounded-2xl border bg-card/70 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70"
          >
            <h2 className="font-heading text-lg font-bold">{feature}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}

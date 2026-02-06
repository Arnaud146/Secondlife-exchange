import { requireServerSession } from "@/lib/auth/server-session";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
      <header>
        <h1 className="font-heading text-3xl font-bold">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Connecté en tant que {session.email ?? session.uid}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-lg font-bold">Rôle de session</h2>
          <p className="mt-2 text-sm text-muted-foreground">{session.role}</p>
          {session.role === "admin" ? (
            <Link
              href="/admin"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Ouvrir le panneau admin
            </Link>
          ) : null}
        </article>
        <article className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-lg font-bold">Espace admin</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            L'accès est protégé par le middleware et les vérifications serveur.
          </p>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">Mes objets</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gérez vos annonces, importez des photos et archivez vos entrées.
          </p>
          <Link
            href="/items"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Ouvrir l'espace objets
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">Thèmes hebdomadaires</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Parcourez les thèmes actifs et à venir utilisés dans les échanges.
          </p>
          <Link
            href="/theme"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Ouvrir la page des thèmes
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">Suggestions IA</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explorez les suggestions hebdomadaires publiées par l'admin, issues de générations IA.
          </p>
          <Link
            href="/suggestions"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Ouvrir la page des suggestions
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-5 md:col-span-2">
          <h2 className="font-heading text-lg font-bold">Découverte éco</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Parcourez du contenu écologique pratique avec des filtres par type, tag, langue et
            thème.
          </p>
          <Link
            href="/eco-discover"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Ouvrir la découverte éco
          </Link>
        </article>
      </section>
    </main>
  );
}

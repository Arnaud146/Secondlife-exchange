import Link from "next/link";

import { requireAdminSession } from "@/lib/auth/server-session";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-bold">Panneau d'administration</h1>
      <p className="text-muted-foreground">
        Vérification RBAC réussie pour {session.email ?? session.uid}.
      </p>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">Administration des thèmes</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Planifiez les thèmes hebdomadaires et gérez le calendrier éditorial.
        </p>
        <Link
          href="/admin/themes"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Ouvrir le gestionnaire de thèmes
        </Link>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">Modération des suggestions IA</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Générez des lots de suggestions hebdomadaires et approuvez ou rejetez les entrées non
          publiées.
        </p>
        <Link
          href="/admin/suggestions"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Ouvrir le gestionnaire de suggestions
        </Link>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">Gestion du contenu éco</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Créez des articles, vidéos et statistiques pour l'expérience de découverte éco.
        </p>
        <Link
          href="/admin/eco-contents"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Ouvrir le gestionnaire éco
        </Link>
      </section>
    </main>
  );
}

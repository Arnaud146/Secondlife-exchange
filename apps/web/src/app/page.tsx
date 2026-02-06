import Link from "next/link";

import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Objets d'échange",
    description: "Publiez et parcourez des objets de seconde main à échanger sans argent.",
    href: "/items",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    title: "Thèmes hebdomadaires",
    description: "Chaque semaine, un thème communautaire guide les échanges et les suggestions.",
    href: "/theme",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
    gradient: "from-accent/20 to-accent/5",
    iconBg: "bg-accent/10 text-accent",
  },
  {
    title: "Suggestions IA",
    description: "Des idées générées par IA et validées par l'admin pour inspirer vos échanges.",
    href: "/suggestions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-.985 0-1.92.407-2.588 1.071l-.548-.547Z" />
      </svg>
    ),
    gradient: "from-yellow-400/20 to-yellow-400/5",
    iconBg: "bg-yellow-400/10 text-yellow-600",
  },
  {
    title: "Découverte éco",
    description: "Articles, vidéos et statistiques pour adopter des habitudes à faible impact.",
    href: "/eco-discover",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2 1.63-.225 2.29.89 3.9.7 1.61-.19 2.1-1.3 3.6-1.3s1.99 1.11 3.6 1.3c1.61.19 2.27-.925 3.9-.7 1.63.225 2.65 1.213 3.1 2.2" />
        <path d="M12 2a10 10 0 0 1 0 20" />
        <path d="M12 2a10 10 0 0 0 0 20" />
        <path d="M12 2v20" />
        <path d="M2 12h20" />
      </svg>
    ),
    gradient: "from-emerald-400/20 to-emerald-400/5",
    iconBg: "bg-emerald-400/10 text-emerald-600",
  },
];

const stats = [
  { value: "100%", label: "Gratuit" },
  { value: "0 \u20AC", label: "Aucun frais" },
  { value: "\u267B\uFE0F", label: "Éco-responsable" },
  { value: "\uD83E\uDD1D", label: "Communautaire" },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      {/* ---- decorative background blobs ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-20 h-[400px] w-[400px] rounded-full bg-accent/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-secondary/30 blur-3xl"
      />

      {/* ---- hero ---- */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-8 pt-20 text-center md:pb-16 md:pt-28">
        <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
          SecondLife Exchange
        </span>

        <h1 className="animate-fade-in-up font-heading mt-8 text-4xl font-black leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl [animation-delay:100ms]">
          Échangez sans argent,{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            prolongez la vie
          </span>{" "}
          des objets.
        </h1>

        <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl [animation-delay:200ms]">
          Donnez une seconde vie à vos objets en les échangeant avec votre communauté, guidé par des
          thèmes hebdomadaires et des suggestions intelligentes.
        </p>

        <div className="animate-fade-in-up mt-10 flex flex-wrap items-center justify-center gap-4 [animation-delay:300ms]">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            <Link href="/auth/signup">
              Commencer gratuitement
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 h-4 w-4"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/auth/signin">Se connecter</Link>
          </Button>
        </div>
      </section>

      {/* ---- stats banner ---- */}
      <section className="mx-auto mt-4 w-full max-w-4xl px-6 md:mt-8">
        <div className="animate-fade-in-up grid grid-cols-2 gap-3 rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur sm:grid-cols-4 sm:gap-0 sm:divide-x [animation-delay:400ms]">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 py-2">
              <span className="font-heading text-2xl font-black text-foreground">{stat.value}</span>
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- features ---- */}
      <section className="mx-auto mt-16 w-full max-w-6xl px-6 md:mt-24">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tout ce qu&apos;il faut pour échanger malin
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Explorez les fonctionnalités pensées pour une communauté engagée et éco-responsable.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((feature, i) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={`animate-fade-in-up group relative overflow-hidden rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg supports-[backdrop-filter]:bg-card/70`}
              style={{ animationDelay: `${500 + i * 100}ms` }}
            >
              {/* gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative z-10">
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                  {feature.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                  Découvrir
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- bottom CTA ---- */}
      <section className="mx-auto mt-20 w-full max-w-6xl px-6 pb-20 md:mt-28 md:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-8 text-center shadow-xl sm:p-12 md:p-16">
          {/* decorative circles */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10"
          />

          <h2 className="font-heading relative text-2xl font-black text-primary-foreground sm:text-3xl md:text-4xl">
            Prêt à donner une seconde vie ?
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Rejoignez la communauté et commencez à échanger dès aujourd&apos;hui. C&apos;est
            gratuit, simple et bon pour la planète.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 border-2 border-white/20 bg-white px-8 text-base font-bold text-primary shadow-lg hover:bg-white/90"
            >
              <Link href="/auth/signup">Créer mon compte</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-2 border-white/40 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/items">Voir les objets</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

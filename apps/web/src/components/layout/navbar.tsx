"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";

import { clearServerSession } from "@/lib/auth/client-session";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  session: {
    uid: string;
    email?: string | null;
    role: "user" | "admin";
  } | null;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/items", label: "Objets" },
  { href: "/theme", label: "Thèmes" },
  { href: "/suggestions", label: "Suggestions" },
  { href: "/eco-discover", label: "Éco" },
] as const;

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await Promise.allSettled([clearServerSession(), signOut(auth)]);
      router.replace("/auth/signin");
      router.refresh();
    } finally {
      setSigningOut(false);
      setMobileOpen(false);
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href={session ? "/dashboard" : "/"}
          className="font-heading text-lg font-black tracking-tight text-primary"
        >
          SecondLife
        </Link>

        {/* Desktop nav links */}
        {session && (
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {session.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                )}
              >
                Admin
              </Link>
            )}
          </div>
        )}

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <span className="mr-1 max-w-[160px] truncate text-xs text-muted-foreground">
                {session.email ?? session.uid}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? "Déconnexion..." : "Se déconnecter"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 hover:text-foreground md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Ouvrir le menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background px-6 pb-4 pt-2 md:hidden">
          {session ? (
            <>
              <p className="mb-3 truncate text-xs text-muted-foreground">
                {session.email ?? session.uid}
              </p>
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {session.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive("/admin")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                    )}
                  >
                    Admin
                  </Link>
                )}
              </div>
              <div className="mt-3 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Déconnexion..." : "Se déconnecter"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" asChild className="justify-start">
                <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                  Connexion
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                  Créer un compte
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

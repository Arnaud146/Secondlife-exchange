import type { Metadata } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";

import { NavbarServer } from "@/components/layout/navbar-server";
import { SwRegister } from "@/components/pwa/sw-register";

import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "SecondLife Exchange",
  description:
    "Plateforme d'échange d'objets de seconde main sans argent avec des thèmes hebdomadaires.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SecondLife Exchange",
    statusBarStyle: "default",
  },
  icons: {
    icon: ["/icons/icon-192.svg", "/icons/icon-512.svg"],
    apple: ["/icons/icon-192.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${nunito.variable} ${spaceGrotesk.variable} antialiased`}>
        <SwRegister />
        <NavbarServer />
        {children}
      </body>
    </html>
  );
}

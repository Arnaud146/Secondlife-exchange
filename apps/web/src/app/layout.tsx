import type { Metadata } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";

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
  description: "Cash-free second-hand exchange platform with weekly themes.",
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
    <html lang="en">
      <body className={`${nunito.variable} ${spaceGrotesk.variable} antialiased`}>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}

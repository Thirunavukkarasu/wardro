import type { Metadata } from "next";
import { Inter as FontSans, Playfair_Display } from "next/font/google";

import { cn } from "@/lib/utils";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wardro — Your family's wardrobe, thoughtfully organized",
  description:
    "Wardro keeps every family member's wardrobe in one calm place, then lets you ask what to wear, find what you own, or photograph a new garment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-wardro-background font-sans text-wardro-text-primary antialiased",
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <noscript>
          <style>{`.reveal{clip-path:none!important;transition:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}

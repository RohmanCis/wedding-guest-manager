import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Wedding Guest Manager",
  description: "Simple source of truth for wedding guests"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable}`}
    >
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

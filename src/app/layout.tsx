import type { Metadata } from "next";
import { TopNav } from "./components/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workflow Wizard",
  description: "Lokal-first prompt generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <TopNav />
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}

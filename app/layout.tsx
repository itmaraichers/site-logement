import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Gestion Logements Salariés",
  description: "Gestion des maisons, chambres et salariés logés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

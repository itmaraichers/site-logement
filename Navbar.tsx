import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getAlertesActives } from "@/lib/alertes";

export const metadata: Metadata = {
  title: "Gestion Logements Salariés",
  description: "Gestion des maisons, chambres et salariés logés",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pas de requête si personne n'est connecté (page de login) —
  // les policies RLS bloqueraient de toute façon la lecture.
  const nombreAlertes = user
    ? (await getAlertesActives(supabase)).length
    : 0;

  return (
    <html lang="fr">
      <body>
        <Navbar nombreAlertes={nombreAlertes} />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

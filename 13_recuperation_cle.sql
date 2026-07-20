"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ToggleCle({
  logementId,
  champ,
  valeur,
  labelActif,
  labelInactif,
}: {
  logementId: string;
  champ: "remise_cles_le" | "date_recuperation_cle";
  valeur: string | null;
  labelActif: string;
  labelInactif: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);

  async function toggle() {
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        [champ]: valeur ? null : new Date().toISOString().slice(0, 10),
      })
      .eq("id", logementId);
    setChargement(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={chargement}
      className={`text-xs font-medium px-2 py-1 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap ${
        valeur
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
      title="Cliquer pour changer"
    >
      {valeur
        ? `🔑 ${labelActif} le ${new Date(valeur).toLocaleDateString("fr-FR")}`
        : `🔑 ${labelInactif}`}
    </button>
  );
}

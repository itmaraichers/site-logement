"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BoutonSupprimer({
  table,
  id,
  redirectTo,
  messageConfirmation,
  className,
  label = "🗑️ Supprimer",
}: {
  table: string;
  id: string;
  redirectTo: string;
  messageConfirmation: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);

  async function supprimer() {
    if (!window.confirm(messageConfirmation)) return;

    setChargement(true);
    const { error } = await supabase.from(table).delete().eq("id", id);
    setChargement(false);

    if (error) {
      window.alert(`Erreur lors de la suppression : ${error.message}`);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={supprimer}
      disabled={chargement}
      className={
        className ??
        "text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
      }
    >
      {chargement ? "Suppression..." : label}
    </button>
  );
}

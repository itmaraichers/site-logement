"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ToggleActifSalarie({
  salarieId,
  actif,
}: {
  salarieId: string;
  actif: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);

  async function toggle() {
    setChargement(true);
    await supabase
      .from("salaries")
      .update({ actif: !actif })
      .eq("id", salarieId);
    setChargement(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={chargement}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
        actif
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {actif ? "Actif" : "Inactif"} · cliquer pour changer
    </button>
  );
}

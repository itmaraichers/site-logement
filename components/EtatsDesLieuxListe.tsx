"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EdlLigne = {
  id: string;
  type_edl: string;
  sens: string;
  date_edl: string;
  pdf_url: string | null;
  maison_id: string;
  chambre_id: string | null;
  maisons: { nom: string } | null;
  chambres: { id: string; nom: string } | null;
  salaries: { nom: string; prenom: string } | null;
};

export default function EtatsDesLieuxListe({
  etatsDesLieux,
  maisons,
}: {
  etatsDesLieux: EdlLigne[];
  maisons: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [maisonFiltre, setMaisonFiltre] = useState("");
  const [sensFiltre, setSensFiltre] = useState("");
  const [chargement, setChargement] = useState(false);

  const filtres = useMemo(() => {
    return etatsDesLieux.filter((e) => {
      if (maisonFiltre && e.maison_id !== maisonFiltre) return false;
      if (sensFiltre && e.sens !== sensFiltre) return false;
      return true;
    });
  }, [etatsDesLieux, maisonFiltre, sensFiltre]);

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer cet état des lieux ?")) return;
    setChargement(true);
    await supabase.from("etats_des_lieux").delete().eq("id", id);
    setChargement(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={maisonFiltre}
          onChange={(e) => setMaisonFiltre(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Toutes les maisons</option>
          {maisons.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {[
            { key: "", label: "Tous" },
            { key: "entree", label: "Entrée" },
            { key: "sortie", label: "Sortie" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSensFiltre(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sensFiltre === f.key
                  ? "bg-primary-500 text-white"
                  : "bg-white border border-slate-300 text-slate-600 hover:bg-primary-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtres.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucun état des lieux ne correspond à ces filtres.
        </p>
      ) : (
        <div className="space-y-2">
          {filtres.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4"
            >
              <div>
                <Link
                  href={
                    e.type_edl === "chambre" && e.chambres
                      ? `/chambres/${e.chambres.id}`
                      : `/maisons/${e.maison_id}`
                  }
                  className="font-medium text-slate-900 hover:text-primary-600"
                >
                  {e.type_edl === "maison" ? "🏠" : "🛏️"} {e.maisons?.nom}
                  {e.chambres && ` · ${e.chambres.nom}`}
                </Link>
                <p className="text-sm text-slate-500 mt-0.5">
                  {e.sens === "entree" ? "Entrée" : "Sortie"}
                  {e.salaries &&
                    ` · ${e.salaries.prenom} ${e.salaries.nom}`}
                  {" · "}
                  {new Date(e.date_edl).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {e.pdf_url ? (
                <a
                  href={e.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline whitespace-nowrap"
                >
                  PDF
                </a>
              ) : (
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Pas de PDF
                </span>
              )}
              <button
                onClick={() => supprimer(e.id)}
                disabled={chargement}
                className="text-sm text-red-600 hover:underline disabled:opacity-50 ml-3 whitespace-nowrap"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

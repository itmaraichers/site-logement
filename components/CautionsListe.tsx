"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CautionLigne = {
  id: string;
  salarie_id: string;
  montant_caution: number;
  date_versement_caution: string | null;
  date_sortie_reelle: string | null;
  date_restitution_caution: string | null;
  montant_restitue: number | null;
  salaries: { nom: string; prenom: string } | null;
  chambres: { nom: string } | null;
  maisons: { nom: string } | null;
};

type Statut = "en_cours" | "a_restituer" | "restituee";

function calculerStatut(c: CautionLigne): Statut {
  if (c.date_restitution_caution) return "restituee";
  if (c.date_sortie_reelle) return "a_restituer";
  return "en_cours";
}

const STATUT_LABEL: Record<Statut, { label: string; classe: string }> = {
  en_cours: { label: "Logé — caution en cours", classe: "bg-blue-100 text-blue-700" },
  a_restituer: { label: "À restituer", classe: "bg-amber-100 text-amber-700" },
  restituee: { label: "Restituée", classe: "bg-green-100 text-green-700" },
};

export default function CautionsListe({
  cautions,
}: {
  cautions: CautionLigne[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [filtre, setFiltre] = useState<Statut | "toutes">("toutes");
  const [restitutionOuverte, setRestitutionOuverte] = useState<string | null>(
    null
  );
  const [dateRestitution, setDateRestitution] = useState("");
  const [montantRestitue, setMontantRestitue] = useState("");
  const [chargement, setChargement] = useState(false);

  const cautionsAvecStatut = useMemo(
    () => cautions.map((c) => ({ ...c, statut: calculerStatut(c) })),
    [cautions]
  );

  const cautionsFiltrees = useMemo(() => {
    if (filtre === "toutes") return cautionsAvecStatut;
    return cautionsAvecStatut.filter((c) => c.statut === filtre);
  }, [cautionsAvecStatut, filtre]);

  function ouvrirRestitution(c: CautionLigne) {
    setRestitutionOuverte(c.id);
    setDateRestitution(new Date().toISOString().slice(0, 10));
    setMontantRestitue(String(c.montant_caution));
  }

  async function confirmerRestitution(logementId: string) {
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        date_restitution_caution: dateRestitution || null,
        montant_restitue: montantRestitue ? Number(montantRestitue) : null,
      })
      .eq("id", logementId);
    setChargement(false);
    setRestitutionOuverte(null);
    router.refresh();
  }

  const FILTRES: { key: Statut | "toutes"; label: string }[] = [
    { key: "toutes", label: "Toutes" },
    { key: "en_cours", label: "En cours" },
    { key: "a_restituer", label: "À restituer" },
    { key: "restituee", label: "Restituées" },
  ];

  const totalEnCours = cautionsAvecStatut
    .filter((c) => c.statut !== "restituee")
    .reduce((somme, c) => somme + Number(c.montant_caution), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtre === f.key
                  ? "bg-primary-500 text-white"
                  : "bg-white border border-slate-300 text-slate-600 hover:bg-primary-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Total non restitué :{" "}
          <span className="font-semibold text-slate-900">
            {totalEnCours.toFixed(2)} €
          </span>
        </p>
      </div>

      {cautionsFiltrees.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucune caution ne correspond à ce filtre.
        </p>
      ) : (
        <div className="space-y-2">
          {cautionsFiltrees.map((c) => {
            const badge = STATUT_LABEL[c.statut];
            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/salaries/${c.salarie_id}`}
                      className="text-sm font-medium text-slate-900 hover:text-primary-600"
                    >
                      {c.salaries?.prenom} {c.salaries?.nom}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.maisons?.nom} · {c.chambres?.nom} ·{" "}
                      <span className="font-medium">
                        {c.montant_caution} €
                      </span>
                      {c.date_versement_caution &&
                        ` · versée le ${new Date(
                          c.date_versement_caution
                        ).toLocaleDateString("fr-FR")}`}
                    </p>
                    {c.statut === "restituee" && (
                      <p className="text-xs text-green-700 mt-0.5">
                        Restituée ({c.montant_restitue ?? 0} €) le{" "}
                        {new Date(
                          c.date_restitution_caution as string
                        ).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge.classe}`}
                    >
                      {badge.label}
                    </span>
                    {c.statut === "a_restituer" && (
                      <button
                        onClick={() => ouvrirRestitution(c)}
                        className="text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-md whitespace-nowrap"
                      >
                        Restituer
                      </button>
                    )}
                  </div>
                </div>

                {restitutionOuverte === c.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 max-w-sm">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Date de restitution
                        </label>
                        <input
                          type="date"
                          value={dateRestitution}
                          onChange={(e) =>
                            setDateRestitution(e.target.value)
                          }
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Montant restitué (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={montantRestitue}
                          onChange={(e) =>
                            setMontantRestitue(e.target.value)
                          }
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRestitutionOuverte(null)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => confirmerRestitution(c.id)}
                        disabled={chargement}
                        className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                      >
                        {chargement ? "..." : "Confirmer la restitution"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

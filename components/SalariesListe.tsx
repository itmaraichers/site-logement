"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type SalarieLigne = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  actif: boolean;
  logement: {
    date_entree: string;
    date_sortie_prevue: string | null;
    chambre_nom: string | null;
    maison_nom: string | null;
  } | null;
};

export default function SalariesListe({
  salaries,
}: {
  salaries: SalarieLigne[];
}) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<
    "tous" | "actif" | "inactif" | "loge" | "sorti"
  >("tous");

  const salariesFiltres = useMemo(() => {
    return salaries.filter((s) => {
      const nomComplet = `${s.prenom} ${s.nom}`.toLowerCase();
      if (!nomComplet.includes(recherche.toLowerCase())) return false;

      switch (filtre) {
        case "actif":
          return s.actif;
        case "inactif":
          return !s.actif;
        case "loge":
          return !!s.logement;
        case "sorti":
          return !s.logement;
        default:
          return true;
      }
    });
  }, [salaries, recherche, filtre]);

  const FILTRES: { key: typeof filtre; label: string }[] = [
    { key: "tous", label: "Tous" },
    { key: "actif", label: "Actifs" },
    { key: "inactif", label: "Inactifs" },
    { key: "loge", label: "Logés" },
    { key: "sorti", label: "Sortis" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher un salarié..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
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
      </div>

      {salariesFiltres.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucun salarié ne correspond à ta recherche.
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Téléphone</th>
                <th className="px-4 py-2.5 font-medium">Logement actuel</th>
                <th className="px-4 py-2.5 font-medium">Entrée / Sortie prévue</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {salariesFiltres.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/salaries/${s.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {s.prenom} {s.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.telephone || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.logement
                      ? `${s.logement.maison_nom ?? ""} — ${
                          s.logement.chambre_nom ?? ""
                        }`
                      : "Non logé"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.logement
                      ? `${new Date(s.logement.date_entree).toLocaleDateString(
                          "fr-FR"
                        )}${
                          s.logement.date_sortie_prevue
                            ? ` → ${new Date(
                                s.logement.date_sortie_prevue
                              ).toLocaleDateString("fr-FR")}`
                            : ""
                        }`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.actif
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

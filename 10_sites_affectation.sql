"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type MaisonResume = {
  maison_id: string;
  nom: string;
  adresse: string | null;
  actif: boolean;
  nb_chambres: number;
  nb_salaries_presents: number;
  dernier_entretien: string | null;
  prochaine_alerte_entretien: string | null;
};

export default function MaisonsListe({
  maisons,
}: {
  maisons: MaisonResume[];
}) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<
    "toutes" | "active" | "inactive" | "occupee" | "disponible"
  >("toutes");

  const maisonsFiltrees = useMemo(() => {
    return maisons.filter((m) => {
      const matchRecherche =
        m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        (m.adresse ?? "").toLowerCase().includes(recherche.toLowerCase());

      if (!matchRecherche) return false;

      switch (filtre) {
        case "active":
          return m.actif;
        case "inactive":
          return !m.actif;
        case "occupee":
          return m.nb_salaries_presents > 0;
        case "disponible":
          return m.nb_salaries_presents < m.nb_chambres;
        default:
          return true;
      }
    });
  }, [maisons, recherche, filtre]);

  const FILTRES: { key: typeof filtre; label: string }[] = [
    { key: "toutes", label: "Toutes" },
    { key: "active", label: "Actives" },
    { key: "inactive", label: "Inactives" },
    { key: "occupee", label: "Occupées" },
    { key: "disponible", label: "Disponibles" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher une maison..."
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

      {maisonsFiltrees.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucune maison ne correspond à ta recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maisonsFiltrees.map((m) => (
            <Link
              key={m.maison_id}
              href={`/maisons/${m.maison_id}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{m.nom}</h3>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    m.actif
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m.actif ? "Active" : "Inactive"}
                </span>
              </div>
              {m.adresse && (
                <p className="text-sm text-slate-500 mb-3">{m.adresse}</p>
              )}
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  🛏️ {m.nb_chambres} chambre{m.nb_chambres > 1 ? "s" : ""} —{" "}
                  {m.nb_salaries_presents} salarié
                  {m.nb_salaries_presents > 1 ? "s" : ""} présent
                  {m.nb_salaries_presents > 1 ? "s" : ""}
                </p>
                {m.dernier_entretien && (
                  <p className="text-slate-400">
                    Dernier entretien :{" "}
                    {new Date(m.dernier_entretien).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {m.prochaine_alerte_entretien && (
                  <p className="text-amber-600 font-medium">
                    Prochain entretien :{" "}
                    {new Date(m.prochaine_alerte_entretien).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

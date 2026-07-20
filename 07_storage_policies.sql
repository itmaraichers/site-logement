"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type ChambreLigne = {
  chambre_id: string;
  maison_id: string;
  nom: string;
  capacite: number;
  nb_occupants_actuels: number;
  statut: string;
  maisons: { nom: string } | null;
};

const STATUT_LABEL: Record<string, { label: string; classe: string }> = {
  libre: { label: "Libre", classe: "bg-green-100 text-green-700" },
  partiellement_occupee: {
    label: "Partiellement occupée",
    classe: "bg-amber-100 text-amber-700",
  },
  occupee: { label: "Occupée", classe: "bg-slate-200 text-slate-700" },
};

export default function ChambresListe({
  chambres,
}: {
  chambres: ChambreLigne[];
}) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<
    "toutes" | "libre" | "partiellement_occupee" | "occupee"
  >("toutes");

  const chambresFiltrees = useMemo(() => {
    return chambres.filter((c) => {
      const matchRecherche =
        c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        (c.maisons?.nom ?? "").toLowerCase().includes(recherche.toLowerCase());

      if (!matchRecherche) return false;
      if (filtre === "toutes") return true;
      return c.statut === filtre;
    });
  }, [chambres, recherche, filtre]);

  const FILTRES: { key: typeof filtre; label: string }[] = [
    { key: "toutes", label: "Toutes" },
    { key: "libre", label: "Libres" },
    { key: "partiellement_occupee", label: "Partiellement occupées" },
    { key: "occupee", label: "Occupées" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher une chambre ou une maison..."
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

      {chambresFiltrees.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucune chambre ne correspond à ta recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chambresFiltrees.map((c) => {
            const statut = STATUT_LABEL[c.statut] ?? STATUT_LABEL.libre;
            return (
              <Link
                key={c.chambre_id}
                href={`/chambres/${c.chambre_id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-slate-900">{c.nom}</h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statut.classe}`}
                  >
                    {statut.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  {c.maisons?.nom}
                </p>
                <p className="text-sm text-slate-600">
                  {c.nb_occupants_actuels} / {c.capacite} occupant
                  {c.capacite > 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

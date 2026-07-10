"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type EntretienLigne = {
  id: string;
  maison_id: string;
  type_entretien_libelle: string | null;
  date_realisation: string | null;
  prochaine_date: string | null;
  commentaire: string | null;
  maisons: { nom: string } | null;
};

function calculerStatut(
  prochaineDate: string | null,
  seuilJours: number
): "a_jour" | "a_prevoir" | "en_retard" | "non_planifie" {
  if (!prochaineDate) return "non_planifie";
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  const cible = new Date(prochaineDate);
  const joursRestants = Math.floor(
    (cible.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (joursRestants < 0) return "en_retard";
  if (joursRestants <= seuilJours) return "a_prevoir";
  return "a_jour";
}

const STATUT_LABEL: Record<string, { label: string; classe: string }> = {
  a_jour: { label: "À jour", classe: "bg-green-100 text-green-700" },
  a_prevoir: { label: "À prévoir", classe: "bg-amber-100 text-amber-700" },
  en_retard: { label: "En retard", classe: "bg-red-100 text-red-700" },
  non_planifie: {
    label: "Non planifié",
    classe: "bg-slate-100 text-slate-500",
  },
};

export default function EntretiensListe({
  entretiens,
  maisons,
  types,
  seuilAlerteJours,
}: {
  entretiens: EntretienLigne[];
  maisons: { id: string; nom: string }[];
  types: string[];
  seuilAlerteJours: number;
}) {
  const [maisonFiltre, setMaisonFiltre] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");

  const entretiensAvecStatut = useMemo(
    () =>
      entretiens.map((e) => ({
        ...e,
        statutCalcule: calculerStatut(e.prochaine_date, seuilAlerteJours),
      })),
    [entretiens, seuilAlerteJours]
  );

  const entretiensFiltres = useMemo(() => {
    return entretiensAvecStatut.filter((e) => {
      if (maisonFiltre && e.maison_id !== maisonFiltre) return false;
      if (typeFiltre && e.type_entretien_libelle !== typeFiltre) return false;
      if (statutFiltre && e.statutCalcule !== statutFiltre) return false;
      return true;
    });
  }, [entretiensAvecStatut, maisonFiltre, typeFiltre, statutFiltre]);

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

        <select
          value={typeFiltre}
          onChange={(e) => setTypeFiltre(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="flex gap-1 flex-wrap">
          {[
            { key: "", label: "Tous statuts" },
            { key: "en_retard", label: "En retard" },
            { key: "a_prevoir", label: "À prévoir" },
            { key: "a_jour", label: "À jour" },
            { key: "non_planifie", label: "Non planifié" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatutFiltre(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statutFiltre === f.key
                  ? "bg-primary-500 text-white"
                  : "bg-white border border-slate-300 text-slate-600 hover:bg-primary-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {entretiensFiltres.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucun entretien ne correspond à ces filtres.
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Maison</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Réalisé le</th>
                <th className="px-4 py-2.5 font-medium">Prochaine date</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {entretiensFiltres.map((e) => {
                const statut = STATUT_LABEL[e.statutCalcule];
                return (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/maisons/${e.maison_id}`}
                        className="font-medium text-slate-900 hover:text-primary-600"
                      >
                        {e.maisons?.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {e.type_entretien_libelle}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {e.date_realisation
                        ? new Date(e.date_realisation).toLocaleDateString(
                            "fr-FR"
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {e.prochaine_date
                        ? new Date(e.prochaine_date).toLocaleDateString(
                            "fr-FR"
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statut.classe}`}
                      >
                        {statut.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

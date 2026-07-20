"use client";

import { useState, useMemo } from "react";

type DocumentLigne = {
  id: string;
  nom: string;
  type_document: string | null;
  url: string;
  created_at: string;
  maisons: { nom: string } | null;
  chambres: { nom: string } | null;
  salaries: { nom: string; prenom: string } | null;
};

export default function DocumentsListe({
  documents,
  maisons,
}: {
  documents: DocumentLigne[];
  maisons: { id: string; nom: string }[];
}) {
  const [recherche, setRecherche] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [maisonFiltre, setMaisonFiltre] = useState("");

  const types = useMemo(
    () =>
      Array.from(
        new Set(documents.map((d) => d.type_document).filter(Boolean))
      ) as string[],
    [documents]
  );

  const documentsFiltres = useMemo(() => {
    return documents.filter((d) => {
      if (!d.nom.toLowerCase().includes(recherche.toLowerCase())) {
        return false;
      }
      if (typeFiltre && d.type_document !== typeFiltre) return false;
      if (maisonFiltre && d.maisons?.nom !== maisonFiltre) return false;
      return true;
    });
  }, [documents, recherche, typeFiltre, maisonFiltre]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher un document..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
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
        <select
          value={maisonFiltre}
          onChange={(e) => setMaisonFiltre(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Toutes les maisons</option>
          {maisons.map((m) => (
            <option key={m.id} value={m.nom}>
              {m.nom}
            </option>
          ))}
        </select>
      </div>

      {documentsFiltres.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          Aucun document ne correspond à ces filtres.
        </p>
      ) : (
        <div className="space-y-2">
          {documentsFiltres.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 hover:border-primary-400 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900">📄 {d.nom}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {d.maisons?.nom && `${d.maisons.nom}`}
                  {d.chambres?.nom && ` · ${d.chambres.nom}`}
                  {d.salaries &&
                    ` · ${d.salaries.prenom} ${d.salaries.nom}`}
                </p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap ml-3">
                {d.type_document}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

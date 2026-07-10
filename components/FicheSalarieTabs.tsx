"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Logement = {
  id: string;
  date_entree: string;
  date_sortie_prevue: string | null;
  date_sortie_reelle: string | null;
  remise_cles_le: string | null;
  chambres: { id: string; nom: string } | null;
  maisons: { id: string; nom: string } | null;
};

type Document = {
  id: string;
  nom: string;
  type_document: string | null;
  url: string;
};

type EtatDesLieux = {
  id: string;
  sens: string;
  date_edl: string;
  pdf_url: string | null;
  maisons: { nom: string } | null;
  chambres: { nom: string } | null;
};

const ONGLETS = [
  { key: "logement", label: "Logement actuel" },
  { key: "edl", label: "États des lieux" },
  { key: "documents", label: "Documents" },
  { key: "historique", label: "Historique logement" },
] as const;

type OngletKey = (typeof ONGLETS)[number]["key"];

export default function FicheSalarieTabs({
  salarieId,
  logementActuel,
  historique,
  documents,
  etatsDesLieux,
}: {
  salarieId: string;
  logementActuel: Logement | undefined;
  historique: Logement[];
  documents: Document[];
  etatsDesLieux: EtatDesLieux[];
}) {
  const [onglet, setOnglet] = useState<OngletKey>("logement");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              onglet === o.key
                ? "border-primary-500 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "logement" && (
        <OngletLogementActuel
          salarieId={salarieId}
          logementActuel={logementActuel}
        />
      )}
      {onglet === "edl" && <OngletEdl etatsDesLieux={etatsDesLieux} />}
      {onglet === "documents" && (
        <OngletDocuments salarieId={salarieId} documents={documents} />
      )}
      {onglet === "historique" && <OngletHistorique historique={historique} />}
    </div>
  );
}

// ------------------------------------------------------------------
// LOGEMENT ACTUEL
// ------------------------------------------------------------------
function OngletLogementActuel({
  salarieId,
  logementActuel,
}: {
  salarieId: string;
  logementActuel: Logement | undefined;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);

  async function retirer() {
    if (!logementActuel) return;
    setChargement(true);
    await supabase
      .from("logements")
      .update({ date_sortie_reelle: new Date().toISOString().slice(0, 10) })
      .eq("id", logementActuel.id);
    setChargement(false);
    router.refresh();
  }

  if (!logementActuel) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500 mb-3">
          Ce salarié n'est actuellement logé nulle part.
        </p>
        <p className="text-xs text-slate-400">
          Pour le loger, va dans la fiche d'une chambre et ajoute-le comme
          occupant.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-slate-400">Maison</p>
          <Link
            href={`/maisons/${logementActuel.maisons?.id}`}
            className="text-primary-600 hover:underline font-medium"
          >
            {logementActuel.maisons?.nom}
          </Link>
        </div>
        <div>
          <p className="text-slate-400">Chambre</p>
          <Link
            href={`/chambres/${logementActuel.chambres?.id}`}
            className="text-primary-600 hover:underline font-medium"
          >
            {logementActuel.chambres?.nom}
          </Link>
        </div>
        <div>
          <p className="text-slate-400">Date d'entrée dans le logement</p>
          <p className="text-slate-700 font-medium">
            {new Date(logementActuel.date_entree).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Sortie prévue</p>
          <p className="text-slate-700 font-medium">
            {logementActuel.date_sortie_prevue
              ? new Date(
                  logementActuel.date_sortie_prevue
                ).toLocaleDateString("fr-FR")
              : "—"}
          </p>
        </div>
        {logementActuel.remise_cles_le && (
          <div>
            <p className="text-slate-400">Remise des clés le</p>
            <p className="text-slate-700 font-medium">
              {new Date(logementActuel.remise_cles_le).toLocaleDateString(
                "fr-FR"
              )}
            </p>
          </div>
        )}
      </div>
      <button
        onClick={retirer}
        disabled={chargement}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Retirer du logement (clôturer le séjour aujourd'hui)
      </button>
    </div>
  );
}

// ------------------------------------------------------------------
// ÉTATS DES LIEUX
// ------------------------------------------------------------------
function OngletEdl({ etatsDesLieux }: { etatsDesLieux: EtatDesLieux[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer cet état des lieux ?")) return;
    setChargement(true);
    await supabase.from("etats_des_lieux").delete().eq("id", id);
    setChargement(false);
    router.refresh();
  }

  return etatsDesLieux.length === 0 ? (
    <p className="text-sm text-slate-500 py-6 text-center">
      Aucun état des lieux pour ce salarié.
    </p>
  ) : (
    <div className="space-y-2">
      {etatsDesLieux.map((edl) => (
        <div
          key={edl.id}
          className="flex items-center justify-between border border-slate-200 rounded-lg p-3"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">
              {edl.sens === "entree" ? "Entrée" : "Sortie"} —{" "}
              {edl.maisons?.nom}
              {edl.chambres && ` · ${edl.chambres.nom}`}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(edl.date_edl).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {edl.pdf_url && (
              <a
                href={edl.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline"
              >
                PDF
              </a>
            )}
            <button
              onClick={() => supprimer(edl.id)}
              disabled={chargement}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// DOCUMENTS
// ------------------------------------------------------------------
function OngletDocuments({
  salarieId,
  documents,
}: {
  salarieId: string;
  documents: Document[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [nom, setNom] = useState("");
  const [typeDocument, setTypeDocument] = useState("divers");
  const [fichier, setFichier] = useState<File | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!fichier) return;
    setChargement(true);
    setErreur(null);

    const chemin = `${salarieId}/${Date.now()}-${fichier.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(chemin, fichier);

    if (uploadError) {
      setErreur(uploadError.message);
      setChargement(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(chemin);

    await supabase.from("documents").insert({
      salarie_id: salarieId,
      nom: nom || fichier.name,
      type_document: typeDocument,
      url: publicUrl,
    });

    setChargement(false);
    setNom("");
    setFichier(null);
    router.refresh();
  }

  return (
    <div>
      <form
        onSubmit={ajouter}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <input
          placeholder="Nom du document"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={typeDocument}
          onChange={(e) => setTypeDocument(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="contrat">Contrat</option>
          <option value="piece_identite">Pièce d'identité</option>
          <option value="document_logement">Document logement</option>
          <option value="attestation">Attestation</option>
          <option value="divers">Divers</option>
        </select>
        <input
          required
          type="file"
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          className="sm:col-span-2 text-sm"
        />
        {erreur && (
          <p className="text-sm text-red-600 sm:col-span-2">{erreur}</p>
        )}
        <button
          type="submit"
          disabled={chargement || !fichier}
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md sm:col-span-2 disabled:opacity-50"
        >
          {chargement ? "Envoi..." : "Ajouter le document"}
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Aucun document pour ce salarié.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:border-primary-400 transition-colors"
            >
              <span className="text-sm font-medium text-slate-900">
                📄 {d.nom}
              </span>
              <span className="text-xs text-slate-400">
                {d.type_document}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// HISTORIQUE
// ------------------------------------------------------------------
function OngletHistorique({ historique }: { historique: Logement[] }) {
  return historique.length === 0 ? (
    <p className="text-sm text-slate-500 py-6 text-center">
      Aucun logement précédent enregistré.
    </p>
  ) : (
    <div className="space-y-2">
      {historique.map((l) => (
        <div key={l.id} className="border border-slate-200 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-900">
            {l.maisons?.nom} — {l.chambres?.nom}
          </p>
          <p className="text-sm text-slate-500">
            Date d'entrée dans le logement :{" "}
            {new Date(l.date_entree).toLocaleDateString("fr-FR")}
            {" · "}
            Date de départ :{" "}
            {l.date_sortie_reelle &&
              new Date(l.date_sortie_reelle).toLocaleDateString("fr-FR")}
          </p>
        </div>
      ))}
    </div>
  );
}

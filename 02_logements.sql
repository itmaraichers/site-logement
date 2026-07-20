"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ToggleCle from "@/components/ToggleCle";

type Logement = {
  id: string;
  date_entree: string;
  date_sortie_prevue: string | null;
  date_sortie_reelle: string | null;
  remise_cles_le: string | null;
  date_recuperation_cle: string | null;
  montant_caution: number | null;
  date_versement_caution: string | null;
  date_restitution_caution: string | null;
  montant_restitue: number | null;
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

type Note = {
  id: string;
  contenu: string;
  created_at: string;
};

const ONGLETS = [
  { key: "logement", label: "Logement actuel" },
  { key: "edl", label: "États des lieux" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes internes" },
  { key: "historique", label: "Historique logement" },
] as const;

type OngletKey = (typeof ONGLETS)[number]["key"];

export default function FicheSalarieTabs({
  salarieId,
  logementActuel,
  historique,
  documents,
  etatsDesLieux,
  notes,
}: {
  salarieId: string;
  logementActuel: Logement | undefined;
  historique: Logement[];
  documents: Document[];
  etatsDesLieux: EtatDesLieux[];
  notes: Note[];
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
      {onglet === "notes" && (
        <OngletNotes salarieId={salarieId} notes={notes} />
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
  const [restitutionOuverte, setRestitutionOuverte] = useState(false);
  const [dateRestitution, setDateRestitution] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [montantRestitue, setMontantRestitue] = useState(
    logementActuel?.montant_caution != null
      ? String(logementActuel.montant_caution)
      : ""
  );
  const [ajoutCautionOuvert, setAjoutCautionOuvert] = useState(false);
  const [nouveauMontantCaution, setNouveauMontantCaution] = useState("");
  const [nouvelleDateVersement, setNouvelleDateVersement] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [cautionRestitutionOuverte, setCautionRestitutionOuverte] =
    useState(false);
  const [dateCautionRestituee, setDateCautionRestituee] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [montantCautionRestitue, setMontantCautionRestitue] = useState(
    logementActuel?.montant_caution != null
      ? String(logementActuel.montant_caution)
      : ""
  );

  function ouvrirAjoutCaution() {
    setNouveauMontantCaution(
      logementActuel?.montant_caution != null
        ? String(logementActuel.montant_caution)
        : ""
    );
    setNouvelleDateVersement(
      logementActuel?.date_versement_caution ??
        new Date().toISOString().slice(0, 10)
    );
    setAjoutCautionOuvert(true);
  }

  async function enregistrerCaution() {
    if (!logementActuel || !nouveauMontantCaution) return;
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        montant_caution: Number(nouveauMontantCaution),
        date_versement_caution: nouvelleDateVersement || null,
      })
      .eq("id", logementActuel.id);
    setChargement(false);
    setAjoutCautionOuvert(false);
    router.refresh();
  }

  async function supprimerCaution() {
    if (!logementActuel) return;
    if (
      !window.confirm(
        "Supprimer cette caution ? Toutes ses infos (montant, dates, restitution) seront effacées."
      )
    )
      return;
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        montant_caution: null,
        date_versement_caution: null,
        date_restitution_caution: null,
        montant_restitue: null,
      })
      .eq("id", logementActuel.id);
    setChargement(false);
    router.refresh();
  }

  async function marquerCautionRestituee() {
    if (!logementActuel) return;
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        date_restitution_caution: dateCautionRestituee || null,
        montant_restitue: montantCautionRestitue
          ? Number(montantCautionRestitue)
          : null,
      })
      .eq("id", logementActuel.id);
    setChargement(false);
    setCautionRestitutionOuverte(false);
    router.refresh();
  }

  async function retirer() {
    if (!logementActuel) return;
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        date_sortie_reelle: new Date().toISOString().slice(0, 10),
        ...(logementActuel.montant_caution != null
          ? {
              date_restitution_caution: dateRestitution || null,
              montant_restitue: montantRestitue
                ? Number(montantRestitue)
                : null,
            }
          : {}),
      })
      .eq("id", logementActuel.id);
    setChargement(false);
    setRestitutionOuverte(false);
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
        <div>
          <p className="text-slate-400 mb-1">Clés</p>
          <div className="flex flex-wrap gap-1.5">
            <ToggleCle
              logementId={logementActuel.id}
              champ="remise_cles_le"
              valeur={logementActuel.remise_cles_le}
              labelActif="Clé remise"
              labelInactif="Clé non remise"
            />
            <ToggleCle
              logementId={logementActuel.id}
              champ="date_recuperation_cle"
              valeur={logementActuel.date_recuperation_cle}
              labelActif="Clé récupérée"
              labelInactif="Clé pas récupérée"
            />
          </div>
        </div>
        {logementActuel.montant_caution != null ? (
          <div>
            <p className="text-slate-400">Caution</p>
            <p className="text-slate-700 font-medium">
              {logementActuel.montant_caution} €
              {logementActuel.date_versement_caution &&
                ` · versée le ${new Date(
                  logementActuel.date_versement_caution
                ).toLocaleDateString("fr-FR")}`}
            </p>
            {logementActuel.date_restitution_caution && (
              <p className="text-xs text-green-700">
                Restituée ({logementActuel.montant_restitue ?? 0} €) le{" "}
                {new Date(
                  logementActuel.date_restitution_caution
                ).toLocaleDateString("fr-FR")}
              </p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={ouvrirAjoutCaution}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Modifier
              </button>
              {!logementActuel.date_restitution_caution && (
                <button
                  onClick={() => setCautionRestitutionOuverte(true)}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Marquer restituée
                </button>
              )}
              <button
                onClick={supprimerCaution}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-slate-400">Caution</p>
            <button
              onClick={ouvrirAjoutCaution}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Ajouter une caution
            </button>
          </div>
        )}
      </div>

      {ajoutCautionOuvert && (
        <div className="border-t border-slate-100 pt-4 mb-4 space-y-2">
          <p className="text-xs font-medium text-slate-600">
            {logementActuel.montant_caution != null
              ? "Modifier la caution"
              : "Nouvelle caution"}
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={nouveauMontantCaution}
                onChange={(e) => setNouveauMontantCaution(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Date de versement
              </label>
              <input
                type="date"
                value={nouvelleDateVersement}
                onChange={(e) => setNouvelleDateVersement(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAjoutCautionOuvert(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
            <button
              onClick={enregistrerCaution}
              disabled={chargement || !nouveauMontantCaution}
              className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              {chargement ? "..." : "Enregistrer la caution"}
            </button>
          </div>
        </div>
      )}

      {cautionRestitutionOuverte && (
        <div className="border-t border-slate-100 pt-4 mb-4 space-y-2">
          <p className="text-xs font-medium text-slate-600">
            Marquer la caution comme restituée
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Date de restitution
              </label>
              <input
                type="date"
                value={dateCautionRestituee}
                onChange={(e) => setDateCautionRestituee(e.target.value)}
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
                value={montantCautionRestitue}
                onChange={(e) => setMontantCautionRestitue(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCautionRestitutionOuverte(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
            <button
              onClick={marquerCautionRestituee}
              disabled={chargement}
              className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              {chargement ? "..." : "Confirmer la restitution"}
            </button>
          </div>
        </div>
      )}

      {!restitutionOuverte ? (
        <button
          onClick={() => setRestitutionOuverte(true)}
          disabled={chargement}
          className="text-sm text-red-600 hover:underline disabled:opacity-50"
        >
          Retirer du logement (clôturer le séjour aujourd'hui)
        </button>
      ) : (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {logementActuel.montant_caution != null && (
            <>
              <p className="text-xs font-medium text-slate-600">
                Restitution de la caution
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Date de restitution
                  </label>
                  <input
                    type="date"
                    value={dateRestitution}
                    onChange={(e) => setDateRestitution(e.target.value)}
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
                    onChange={(e) => setMontantRestitue(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setRestitutionOuverte(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
            <button
              onClick={retirer}
              disabled={chargement}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              {chargement ? "..." : "Confirmer le retrait"}
            </button>
          </div>
        </div>
      )}
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
            {edl.pdf_url ? (
              <a
                href={edl.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline"
              >
                PDF
              </a>
            ) : (
              <span className="text-xs text-slate-400">PDF indisponible</span>
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
// NOTES INTERNES
// ------------------------------------------------------------------
function OngletNotes({
  salarieId,
  notes,
}: {
  salarieId: string;
  notes: Note[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [contenu, setContenu] = useState("");
  const [chargement, setChargement] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    setChargement(true);
    await supabase.from("notes").insert({ salarie_id: salarieId, contenu });
    setChargement(false);
    setContenu("");
    router.refresh();
  }

  return (
    <div>
      <form
        onSubmit={ajouter}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-4"
      >
        <textarea
          placeholder="Ajouter une note..."
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-2"
        />
        <button
          type="submit"
          disabled={chargement}
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {chargement ? "Ajout..." : "Ajouter la note"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Aucune note pour ce salarié.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="border border-slate-200 rounded-lg p-3"
            >
              <p className="text-sm text-slate-700">{n.contenu}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(n.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
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
          {l.montant_caution != null && (
            <p className="text-sm text-slate-500 mt-1">
              💰 Caution {l.montant_caution} € —{" "}
              {l.date_restitution_caution
                ? `restituée (${l.montant_restitue ?? 0} €) le ${new Date(
                    l.date_restitution_caution
                  ).toLocaleDateString("fr-FR")}`
                : "non restituée"}
            </p>
          )}
          <div className="mt-1.5">
            <ToggleCle
              logementId={l.id}
              champ="date_recuperation_cle"
              valeur={l.date_recuperation_cle}
              labelActif="Clé récupérée"
              labelInactif="Clé pas récupérée"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

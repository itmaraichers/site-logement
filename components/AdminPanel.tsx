"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TypeEntretien = { id: string; nom: string; actif: boolean };
type Parametres = {
  mail_actif: boolean;
  mail_expediteur: string | null;
  sms_actif: boolean;
  seuil_alerte_jours: number;
};
type Statut = {
  id: string;
  categorie: string;
  valeur: string;
  libelle: string;
  actif: boolean;
};
type Langue = { id: string; code: string; libelle: string; actif: boolean };
type ModeleDocument = {
  id: string;
  nom: string;
  type_document: string | null;
  url_modele: string | null;
};

const ONGLETS = [
  { key: "types", label: "Types d'entretien" },
  { key: "notifications", label: "Notifications" },
  { key: "statuts", label: "Statuts" },
  { key: "langues", label: "Langues" },
  { key: "modeles", label: "Modèles de documents" },
] as const;

type OngletKey = (typeof ONGLETS)[number]["key"];

export default function AdminPanel({
  typesEntretien,
  parametres,
  statuts,
  langues,
  modelesDocuments,
}: {
  typesEntretien: TypeEntretien[];
  parametres: Parametres;
  statuts: Statut[];
  langues: Langue[];
  modelesDocuments: ModeleDocument[];
}) {
  const [onglet, setOnglet] = useState<OngletKey>("types");

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

      {onglet === "types" && <OngletTypesEntretien types={typesEntretien} />}
      {onglet === "notifications" && (
        <OngletNotifications parametres={parametres} />
      )}
      {onglet === "statuts" && <OngletStatuts statuts={statuts} />}
      {onglet === "langues" && <OngletLangues langues={langues} />}
      {onglet === "modeles" && (
        <OngletModelesDocuments modeles={modelesDocuments} />
      )}

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-1">
          👥 Gestion des utilisateurs
        </p>
        <p>
          Les comptes (toi + collègues) se créent directement dans Supabase →
          Authentication → Users. Pas de gestion depuis l'appli dans cette v1
          test, pour rester simple.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// TYPES D'ENTRETIEN
// ------------------------------------------------------------------
function OngletTypesEntretien({ types }: { types: TypeEntretien[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [nouveauType, setNouveauType] = useState("");
  const [chargement, setChargement] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauType.trim()) return;
    setChargement(true);
    await supabase.from("types_entretien").insert({ nom: nouveauType });
    setChargement(false);
    setNouveauType("");
    router.refresh();
  }

  async function toggle(id: string, actif: boolean) {
    await supabase
      .from("types_entretien")
      .update({ actif: !actif })
      .eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={ajouter} className="flex gap-2 mb-4">
        <input
          value={nouveauType}
          onChange={(e) => setNouveauType(e.target.value)}
          placeholder="Nouveau type d'entretien (ex: Ventilation)"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={chargement}
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {types.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span
              className={`text-sm ${
                t.actif ? "text-slate-900" : "text-slate-400 line-through"
              }`}
            >
              {t.nom}
            </span>
            <button
              onClick={() => toggle(t.id, t.actif)}
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                t.actif
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.actif ? "Actif" : "Inactif"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------
function OngletNotifications({ parametres }: { parametres: Parametres }) {
  const router = useRouter();
  const supabase = createClient();
  const [mailActif, setMailActif] = useState(parametres.mail_actif);
  const [mailExpediteur, setMailExpediteur] = useState(
    parametres.mail_expediteur ?? ""
  );
  const [seuilAlerteJours, setSeuilAlerteJours] = useState(
    parametres.seuil_alerte_jours
  );
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setSucces(false);

    await supabase
      .from("parametres_notification")
      .update({
        mail_actif: mailActif,
        mail_expediteur: mailExpediteur || null,
        seuil_alerte_jours: seuilAlerteJours,
      })
      .eq("id", 1);

    setChargement(false);
    setSucces(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={enregistrer}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 max-w-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Notifications mail</p>
          <p className="text-sm text-slate-500">
            Structure prête, l'envoi réel sera activé plus tard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMailActif(!mailActif)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            mailActif
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {mailActif ? "Activé" : "Désactivé"}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email expéditeur
        </label>
        <input
          value={mailExpediteur}
          onChange={(e) => setMailExpediteur(e.target.value)}
          placeholder="logements@lesmaraichersdenormandie.fr"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between opacity-60">
        <div>
          <p className="font-medium text-slate-900">Notifications SMS</p>
          <p className="text-sm text-slate-500">
            Structure prête (colonne sms_provider), à activer avec une
            solution payante plus tard.
          </p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">
          Désactivé
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Seuil d'alerte (jours avant échéance)
        </label>
        <input
          type="number"
          min={1}
          value={seuilAlerteJours}
          onChange={(e) => setSeuilAlerteJours(Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">
          Utilisé pour les alertes d'entretiens et de sorties sur la page
          Alertes.
        </p>
      </div>

      {succes && (
        <p className="text-sm text-green-600">Paramètres enregistrés.</p>
      )}

      <button
        type="submit"
        disabled={chargement}
        className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {chargement ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}

// ------------------------------------------------------------------
// STATUTS
// ------------------------------------------------------------------
function OngletStatuts({ statuts }: { statuts: Statut[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggle(id: string, actif: boolean) {
    await supabase
      .from("statuts_disponibles")
      .update({ actif: !actif })
      .eq("id", id);
    router.refresh();
  }

  const categories = Array.from(new Set(statuts.map((s) => s.categorie)));

  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-sm font-medium text-slate-700 mb-2 capitalize">
            {cat}
          </p>
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {statuts
              .filter((s) => s.categorie === cat)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span
                    className={`text-sm ${
                      s.actif
                        ? "text-slate-900"
                        : "text-slate-400 line-through"
                    }`}
                  >
                    {s.libelle}
                  </span>
                  <button
                    onClick={() => toggle(s.id, s.actif)}
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      s.actif
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {s.actif ? "Actif" : "Inactif"}
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// LANGUES
// ------------------------------------------------------------------
function OngletLangues({ langues }: { langues: Langue[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [chargement, setChargement] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !libelle.trim()) return;
    setChargement(true);
    await supabase.from("langues_disponibles").insert({ code, libelle });
    setChargement(false);
    setCode("");
    setLibelle("");
    router.refresh();
  }

  async function toggle(id: string, actif: boolean) {
    await supabase
      .from("langues_disponibles")
      .update({ actif: !actif })
      .eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={ajouter} className="flex gap-2 mb-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code (ex: en)"
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder="Libellé (ex: English)"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={chargement}
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {langues.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span
              className={`text-sm ${
                l.actif ? "text-slate-900" : "text-slate-400 line-through"
              }`}
            >
              {l.libelle} ({l.code})
            </span>
            <button
              onClick={() => toggle(l.id, l.actif)}
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                l.actif
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {l.actif ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// MODÈLES DE DOCUMENTS
// ------------------------------------------------------------------
function OngletModelesDocuments({ modeles }: { modeles: ModeleDocument[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [nom, setNom] = useState("");
  const [typeDocument, setTypeDocument] = useState("bail");
  const [fichier, setFichier] = useState<File | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!fichier) return;
    setChargement(true);
    setErreur(null);

    const chemin = `modeles/${Date.now()}-${fichier.name}`;
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

    await supabase.from("modeles_documents").insert({
      nom: nom || fichier.name,
      type_document: typeDocument,
      url_modele: publicUrl,
    });

    setChargement(false);
    setNom("");
    setFichier(null);
    router.refresh();
  }

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer ce modèle ?")) return;
    await supabase.from("modeles_documents").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form
        onSubmit={ajouter}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <input
          placeholder="Nom du modèle"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={typeDocument}
          onChange={(e) => setTypeDocument(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="bail">Bail</option>
          <option value="assurance">Assurance</option>
          <option value="etat_des_lieux">État des lieux</option>
          <option value="contrat">Contrat</option>
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
          {chargement ? "Envoi..." : "Ajouter le modèle"}
        </button>
      </form>

      {modeles.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Aucun modèle de document.
        </p>
      ) : (
        <div className="space-y-2">
          {modeles.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3"
            >
              <a
                href={m.url_modele ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-900 hover:text-primary-600"
              >
                📄 {m.nom} <span className="text-slate-400">({m.type_document})</span>
              </a>
              <button
                onClick={() => supprimer(m.id)}
                className="text-sm text-red-600 hover:underline"
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

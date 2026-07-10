"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Chambre = {
  chambre_id: string;
  nom: string;
  capacite: number;
  nb_occupants_actuels: number;
  statut: string;
};

type TypeEntretien = { id: string; nom: string };

type Entretien = {
  id: string;
  type_entretien_libelle: string | null;
  date_realisation: string | null;
  prochaine_date: string | null;
  statut: string;
  commentaire: string | null;
};

type Document = {
  id: string;
  nom: string;
  type_document: string | null;
  url: string;
  created_at: string;
};

type Note = {
  id: string;
  contenu: string;
  created_at: string;
};

type EtatDesLieux = {
  id: string;
  type_edl: string;
  sens: string;
  date_edl: string;
  pdf_url: string | null;
  salaries: { nom: string; prenom: string } | null;
  chambres: { nom: string } | null;
};

const ONGLETS = [
  { key: "chambres", label: "Chambres" },
  { key: "entretiens", label: "Entretiens" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes internes" },
  { key: "edl", label: "États des lieux" },
] as const;

type OngletKey = (typeof ONGLETS)[number]["key"];

const STATUT_LABEL: Record<string, { label: string; classe: string }> = {
  libre: { label: "Libre", classe: "bg-green-100 text-green-700" },
  partiellement_occupee: {
    label: "Partiellement occupée",
    classe: "bg-amber-100 text-amber-700",
  },
  occupee: { label: "Occupée", classe: "bg-slate-200 text-slate-700" },
};

const STATUT_ENTRETIEN_LABEL: Record<string, { label: string; classe: string }> = {
  a_jour: { label: "À jour", classe: "bg-green-100 text-green-700" },
  a_prevoir: { label: "À prévoir", classe: "bg-amber-100 text-amber-700" },
  en_retard: { label: "En retard", classe: "bg-red-100 text-red-700" },
};

export default function FicheMaisonTabs({
  maisonId,
  chambres,
  typesEntretien,
  entretiens,
  documents,
  notes,
  etatsDesLieux,
}: {
  maisonId: string;
  chambres: Chambre[];
  typesEntretien: TypeEntretien[];
  entretiens: Entretien[];
  documents: Document[];
  notes: Note[];
  etatsDesLieux: EtatDesLieux[];
}) {
  const [onglet, setOnglet] = useState<OngletKey>("chambres");

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

      {onglet === "chambres" && (
        <OngletChambres maisonId={maisonId} chambres={chambres} />
      )}
      {onglet === "entretiens" && (
        <OngletEntretiens
          maisonId={maisonId}
          entretiens={entretiens}
          typesEntretien={typesEntretien}
        />
      )}
      {onglet === "documents" && (
        <OngletDocuments maisonId={maisonId} documents={documents} />
      )}
      {onglet === "notes" && <OngletNotes maisonId={maisonId} notes={notes} />}
      {onglet === "edl" && (
        <OngletEtatsDesLieux maisonId={maisonId} etatsDesLieux={etatsDesLieux} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// CHAMBRES
// ------------------------------------------------------------------
function OngletChambres({
  maisonId,
  chambres,
}: {
  maisonId: string;
  chambres: Chambre[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [capacite, setCapacite] = useState(1);
  const [description, setDescription] = useState("");
  const [mobilier, setMobilier] = useState("");
  const [chargement, setChargement] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    await supabase.from("chambres").insert({
      maison_id: maisonId,
      nom,
      capacite,
      description: description || null,
      mobilier: mobilier || null,
    });
    setChargement(false);
    setOuvert(false);
    setNom("");
    setCapacite(1);
    setDescription("");
    setMobilier("");
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setOuvert(!ouvert)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {ouvert ? "Annuler" : "+ Ajouter une chambre"}
        </button>
      </div>

      {ouvert && (
        <form
          onSubmit={ajouter}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            required
            placeholder="Nom / numéro de chambre"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            min={1}
            placeholder="Capacité"
            value={capacite}
            onChange={(e) => setCapacite(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Mobilier présent"
            value={mobilier}
            onChange={(e) => setMobilier(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            rows={2}
          />
          <button
            type="submit"
            disabled={chargement}
            className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md sm:col-span-2 disabled:opacity-50"
          >
            {chargement ? "Ajout..." : "Ajouter la chambre"}
          </button>
        </form>
      )}

      {chambres.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Aucune chambre pour cette maison.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {chambres.map((c) => {
            const statut = STATUT_LABEL[c.statut] ?? STATUT_LABEL.libre;
            return (
              <Link
                key={c.chambre_id}
                href={`/chambres/${c.chambre_id}`}
                className="border border-slate-200 rounded-lg p-4 hover:border-primary-400 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900">{c.nom}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statut.classe}`}
                  >
                    {statut.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
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

// ------------------------------------------------------------------
// ENTRETIENS
// ------------------------------------------------------------------
function OngletEntretiens({
  maisonId,
  entretiens,
  typesEntretien,
}: {
  maisonId: string;
  entretiens: Entretien[];
  typesEntretien: TypeEntretien[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [ouvert, setOuvert] = useState(false);
  const [typeEntretienId, setTypeEntretienId] = useState("");
  const [dateRealisation, setDateRealisation] = useState("");
  const [prochaineDate, setProchaineDate] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);

    const typeLibelle = typesEntretien.find(
      (t) => t.id === typeEntretienId
    )?.nom;

    await supabase.from("entretiens").insert({
      maison_id: maisonId,
      type_entretien_id: typeEntretienId || null,
      type_entretien_libelle: typeLibelle ?? null,
      date_realisation: dateRealisation || null,
      prochaine_date: prochaineDate || null,
      commentaire: commentaire || null,
      statut: "a_prevoir",
    });

    setChargement(false);
    setOuvert(false);
    setTypeEntretienId("");
    setDateRealisation("");
    setProchaineDate("");
    setCommentaire("");
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setOuvert(!ouvert)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {ouvert ? "Annuler" : "+ Ajouter un entretien"}
        </button>
      </div>

      {ouvert && (
        <form
          onSubmit={ajouter}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <select
            required
            value={typeEntretienId}
            onChange={(e) => setTypeEntretienId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Type d'entretien...</option>
            {typesEntretien.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Date de réalisation
            </label>
            <input
              type="date"
              value={dateRealisation}
              onChange={(e) => setDateRealisation(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Prochaine date prévue
            </label>
            <input
              type="date"
              value={prochaineDate}
              onChange={(e) => setProchaineDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            placeholder="Commentaire"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            rows={2}
          />
          <button
            type="submit"
            disabled={chargement}
            className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md sm:col-span-2 disabled:opacity-50"
          >
            {chargement ? "Ajout..." : "Ajouter l'entretien"}
          </button>
        </form>
      )}

      {entretiens.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Aucun entretien enregistré pour cette maison.
        </p>
      ) : (
        <div className="space-y-2">
          {entretiens.map((e) => {
            const statut =
              STATUT_ENTRETIEN_LABEL[e.statut] ??
              STATUT_ENTRETIEN_LABEL.a_prevoir;
            return (
              <div
                key={e.id}
                className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {e.type_entretien_libelle}
                  </p>
                  <p className="text-sm text-slate-500">
                    {e.date_realisation &&
                      `Réalisé le ${new Date(
                        e.date_realisation
                      ).toLocaleDateString("fr-FR")}`}
                    {e.prochaine_date &&
                      ` · Prochain le ${new Date(
                        e.prochaine_date
                      ).toLocaleDateString("fr-FR")}`}
                  </p>
                  {e.commentaire && (
                    <p className="text-sm text-slate-400 mt-1">
                      {e.commentaire}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statut.classe}`}
                >
                  {statut.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// DOCUMENTS
// ------------------------------------------------------------------
function OngletDocuments({
  maisonId,
  documents,
}: {
  maisonId: string;
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

    const chemin = `${maisonId}/${Date.now()}-${fichier.name}`;
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
      maison_id: maisonId,
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
          <option value="bail">Bail</option>
          <option value="assurance">Assurance</option>
          <option value="diagnostic">Diagnostic</option>
          <option value="facture">Facture</option>
          <option value="photo">Photo</option>
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
          Aucun document pour cette maison.
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
// NOTES
// ------------------------------------------------------------------
function OngletNotes({
  maisonId,
  notes,
}: {
  maisonId: string;
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
    await supabase.from("notes").insert({ maison_id: maisonId, contenu });
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
          Aucune note pour cette maison.
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
// ÉTATS DES LIEUX
// ------------------------------------------------------------------
function OngletEtatsDesLieux({
  maisonId,
  etatsDesLieux,
}: {
  maisonId: string;
  etatsDesLieux: EtatDesLieux[];
}) {
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

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Link
          href="/etats-des-lieux/nouveau"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          + Créer un état des lieux
        </Link>
      </div>

      {etatsDesLieux.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Aucun état des lieux pour cette maison.
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
                  {edl.type_edl === "maison" ? "Maison" : "Chambre"} —{" "}
                  {edl.sens === "entree" ? "Entrée" : "Sortie"}
                  {edl.chambres && ` · ${edl.chambres.nom}`}
                  {edl.salaries &&
                    ` · ${edl.salaries.prenom} ${edl.salaries.nom}`}
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
      )}
    </div>
  );
}

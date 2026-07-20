"use client";

import { useState } from "react";
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
  salaries: { id: string; nom: string; prenom: string } | null;
};

type Salarie = { id: string; nom: string; prenom: string };

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
  salaries: { nom: string; prenom: string } | null;
};

const ONGLETS = [
  { key: "occupants", label: "Occupants" },
  { key: "edl", label: "États des lieux" },
  { key: "documents", label: "Documents" },
] as const;

type OngletKey = (typeof ONGLETS)[number]["key"];

export default function FicheChambreTabs({
  chambreId,
  maisonId,
  capacite,
  occupantsActuels,
  occupantsPasses,
  salariesDisponibles,
  documents,
  etatsDesLieux,
}: {
  chambreId: string;
  maisonId: string;
  capacite: number;
  occupantsActuels: Logement[];
  occupantsPasses: Logement[];
  salariesDisponibles: Salarie[];
  documents: Document[];
  etatsDesLieux: EtatDesLieux[];
}) {
  const [onglet, setOnglet] = useState<OngletKey>("occupants");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-5">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              onglet === o.key
                ? "border-primary-500 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "occupants" && (
        <OngletOccupants
          chambreId={chambreId}
          maisonId={maisonId}
          capacite={capacite}
          occupantsActuels={occupantsActuels}
          occupantsPasses={occupantsPasses}
          salariesDisponibles={salariesDisponibles}
        />
      )}
      {onglet === "edl" && <OngletEdl etatsDesLieux={etatsDesLieux} />}
      {onglet === "documents" && (
        <OngletDocuments chambreId={chambreId} documents={documents} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// OCCUPANTS
// ------------------------------------------------------------------
function OngletOccupants({
  chambreId,
  maisonId,
  capacite,
  occupantsActuels,
  occupantsPasses,
  salariesDisponibles,
}: {
  chambreId: string;
  maisonId: string;
  capacite: number;
  occupantsActuels: Logement[];
  occupantsPasses: Logement[];
  salariesDisponibles: Salarie[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [ouvert, setOuvert] = useState(false);
  const [modeCreation, setModeCreation] = useState(false);
  const [salarieId, setSalarieId] = useState("");
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauPrenom, setNouveauPrenom] = useState("");
  const [dateEntree, setDateEntree] = useState("");
  const [dateSortiePrevue, setDateSortiePrevue] = useState("");
  const [remiseCles, setRemiseCles] = useState("");
  const [montantCaution, setMontantCaution] = useState("");
  const [dateVersementCaution, setDateVersementCaution] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const complet = occupantsActuels.length >= capacite;

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    let idSalarie = salarieId;

    if (modeCreation) {
      const { data: nouveauSalarie, error: erreurSalarie } = await supabase
        .from("salaries")
        .insert({ nom: nouveauNom, prenom: nouveauPrenom })
        .select()
        .single();

      if (erreurSalarie) {
        setErreur(erreurSalarie.message);
        setChargement(false);
        return;
      }
      idSalarie = nouveauSalarie.id;
    }

    const { error } = await supabase.from("logements").insert({
      salarie_id: idSalarie,
      chambre_id: chambreId,
      maison_id: maisonId,
      date_entree: dateEntree,
      date_sortie_prevue: dateSortiePrevue || null,
      remise_cles_le: remiseCles || null,
      montant_caution: montantCaution ? Number(montantCaution) : null,
      date_versement_caution: dateVersementCaution || null,
    });

    setChargement(false);

    if (error) {
      setErreur(
        error.message.includes("uniq_logement_actif_salarie")
          ? "Ce salarié est déjà logé ailleurs actuellement."
          : error.message
      );
      return;
    }

    setOuvert(false);
    setModeCreation(false);
    setSalarieId("");
    setNouveauNom("");
    setNouveauPrenom("");
    setDateEntree("");
    setDateSortiePrevue("");
    setRemiseCles("");
    setMontantCaution("");
    setDateVersementCaution("");
    router.refresh();
  }

  const [restitutionOuverte, setRestitutionOuverte] = useState<string | null>(
    null
  );
  const [dateRestitution, setDateRestitution] = useState("");
  const [montantRestitue, setMontantRestitue] = useState("");
  const [ajoutCautionOuvert, setAjoutCautionOuvert] = useState<string | null>(
    null
  );
  const [nouveauMontantCaution, setNouveauMontantCaution] = useState("");
  const [nouvelleDateVersement, setNouvelleDateVersement] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [cautionRestitutionOuverte, setCautionRestitutionOuverte] = useState<
    string | null
  >(null);
  const [dateCautionRestituee, setDateCautionRestituee] = useState("");
  const [montantCautionRestitue, setMontantCautionRestitue] = useState("");

  function ouvrirAjoutCaution(logement: Logement) {
    setAjoutCautionOuvert(logement.id);
    setNouveauMontantCaution(
      logement.montant_caution != null ? String(logement.montant_caution) : ""
    );
    setNouvelleDateVersement(
      logement.date_versement_caution ??
        new Date().toISOString().slice(0, 10)
    );
  }

  async function enregistrerCaution(logementId: string) {
    if (!nouveauMontantCaution) return;
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        montant_caution: Number(nouveauMontantCaution),
        date_versement_caution: nouvelleDateVersement || null,
      })
      .eq("id", logementId);
    setChargement(false);
    setAjoutCautionOuvert(null);
    router.refresh();
  }

  async function supprimerCaution(logementId: string) {
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
      .eq("id", logementId);
    setChargement(false);
    router.refresh();
  }

  function ouvrirCautionRestitution(logement: Logement) {
    setCautionRestitutionOuverte(logement.id);
    setDateCautionRestituee(new Date().toISOString().slice(0, 10));
    setMontantCautionRestitue(
      logement.montant_caution != null ? String(logement.montant_caution) : ""
    );
  }

  async function marquerCautionRestituee(logementId: string) {
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        date_restitution_caution: dateCautionRestituee || null,
        montant_restitue: montantCautionRestitue
          ? Number(montantCautionRestitue)
          : null,
      })
      .eq("id", logementId);
    setChargement(false);
    setCautionRestitutionOuverte(null);
    router.refresh();
  }

  function ouvrirRestitution(logement: Logement) {
    setRestitutionOuverte(logement.id);
    setDateRestitution(new Date().toISOString().slice(0, 10));
    setMontantRestitue(
      logement.montant_caution != null ? String(logement.montant_caution) : ""
    );
  }

  async function confirmerRetrait(logementId: string, avecCaution: boolean) {
    setChargement(true);
    await supabase
      .from("logements")
      .update({
        date_sortie_reelle: new Date().toISOString().slice(0, 10),
        ...(avecCaution
          ? {
              date_restitution_caution: dateRestitution || null,
              montant_restitue: montantRestitue
                ? Number(montantRestitue)
                : null,
            }
          : {}),
      })
      .eq("id", logementId);
    setChargement(false);
    setRestitutionOuverte(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setOuvert(!ouvert)}
          disabled={complet && !ouvert}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ouvert
            ? "Annuler"
            : complet
            ? "Chambre complète"
            : "+ Ajouter un salarié dans cette chambre"}
        </button>
      </div>

      {ouvert && (
        <form
          onSubmit={ajouter}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
        >
          <div className="flex gap-2 text-sm mb-1">
            <button
              type="button"
              onClick={() => setModeCreation(false)}
              className={`px-3 py-1 rounded-md ${
                !modeCreation
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Salarié existant
            </button>
            <button
              type="button"
              onClick={() => setModeCreation(true)}
              className={`px-3 py-1 rounded-md ${
                modeCreation
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Nouveau salarié
            </button>
          </div>

          {!modeCreation ? (
            <select
              required
              value={salarieId}
              onChange={(e) => setSalarieId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Choisir un salarié...</option>
              {salariesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prenom} {s.nom}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Prénom"
                value={nouveauPrenom}
                onChange={(e) => setNouveauPrenom(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Nom"
                value={nouveauNom}
                onChange={(e) => setNouveauNom(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Date d'entrée *
              </label>
              <input
                required
                type="date"
                value={dateEntree}
                onChange={(e) => setDateEntree(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Sortie prévue
              </label>
              <input
                type="date"
                value={dateSortiePrevue}
                onChange={(e) => setDateSortiePrevue(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Remise des clés le
              </label>
              <input
                type="date"
                value={remiseCles}
                onChange={(e) => setRemiseCles(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Montant de la caution (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex : 300"
                value={montantCaution}
                onChange={(e) => setMontantCaution(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Date de versement de la caution
              </label>
              <input
                type="date"
                value={dateVersementCaution}
                onChange={(e) => setDateVersementCaution(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {chargement ? "Ajout..." : "Ajouter dans la chambre"}
          </button>
        </form>
      )}

      <p className="text-sm font-medium text-slate-700 mb-2">
        Occupants actuels
      </p>
      {occupantsActuels.length === 0 ? (
        <p className="text-sm text-slate-500 py-3">Chambre libre.</p>
      ) : (
        <div className="space-y-2 mb-6">
          {occupantsActuels.map((l) => (
            <div
              key={l.id}
              className="border border-slate-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {l.salaries?.prenom} {l.salaries?.nom}
                  </p>
                  <p className="text-xs text-slate-400">
                    Depuis le{" "}
                    {new Date(l.date_entree).toLocaleDateString("fr-FR")}
                    {l.date_sortie_prevue &&
                      ` · Sortie prévue le ${new Date(
                        l.date_sortie_prevue
                      ).toLocaleDateString("fr-FR")}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <ToggleCle
                      logementId={l.id}
                      champ="remise_cles_le"
                      valeur={l.remise_cles_le}
                      labelActif="Clé remise"
                      labelInactif="Clé non remise"
                    />
                    <ToggleCle
                      logementId={l.id}
                      champ="date_recuperation_cle"
                      valeur={l.date_recuperation_cle}
                      labelActif="Clé récupérée"
                      labelInactif="Clé pas récupérée"
                    />
                  </div>
                  {l.montant_caution != null ? (
                    <div className="mt-1">
                      <p className="text-xs text-slate-500">
                        💰 Caution : {l.montant_caution} €
                        {l.date_versement_caution &&
                          ` · versée le ${new Date(
                            l.date_versement_caution
                          ).toLocaleDateString("fr-FR")}`}
                        {l.date_restitution_caution && (
                          <span className="text-green-700">
                            {" "}
                            · restituée ({l.montant_restitue ?? 0} €) le{" "}
                            {new Date(
                              l.date_restitution_caution
                            ).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        <button
                          onClick={() => ouvrirAjoutCaution(l)}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Modifier
                        </button>
                        {!l.date_restitution_caution && (
                          <button
                            onClick={() => ouvrirCautionRestitution(l)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            Marquer restituée
                          </button>
                        )}
                        <button
                          onClick={() => supprimerCaution(l.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => ouvrirAjoutCaution(l)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1"
                    >
                      + Ajouter une caution
                    </button>
                  )}
                </div>
                <button
                  onClick={() => ouvrirRestitution(l)}
                  disabled={chargement}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50 whitespace-nowrap"
                >
                  Retirer
                </button>
              </div>

              {ajoutCautionOuvert === l.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-w-sm">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Montant de la caution (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        autoFocus
                        value={nouveauMontantCaution}
                        onChange={(e) =>
                          setNouveauMontantCaution(e.target.value)
                        }
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
                        onChange={(e) =>
                          setNouvelleDateVersement(e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAjoutCautionOuvert(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => enregistrerCaution(l.id)}
                      disabled={chargement || !nouveauMontantCaution}
                      className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      {chargement ? "..." : "Enregistrer la caution"}
                    </button>
                  </div>
                </div>
              )}

              {cautionRestitutionOuverte === l.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
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
                        onChange={(e) =>
                          setDateCautionRestituee(e.target.value)
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
                        value={montantCautionRestitue}
                        onChange={(e) =>
                          setMontantCautionRestitue(e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCautionRestitutionOuverte(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => marquerCautionRestituee(l.id)}
                      disabled={chargement}
                      className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      {chargement ? "..." : "Confirmer la restitution"}
                    </button>
                  </div>
                </div>
              )}

              {restitutionOuverte === l.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  {l.montant_caution != null ? (
                    <>
                      <p className="text-xs font-medium text-slate-600">
                        Restitution de la caution
                      </p>
                      <div className="grid grid-cols-2 gap-2">
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
                      <p className="text-xs text-slate-400">
                        Modifie le montant si une retenue est appliquée
                        (dégâts constatés à l'état des lieux de sortie).
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Aucune caution enregistrée pour ce séjour.
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setRestitutionOuverte(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() =>
                        confirmerRetrait(l.id, l.montant_caution != null)
                      }
                      disabled={chargement}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      {chargement ? "..." : "Confirmer le retrait"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {occupantsPasses.length > 0 && (
        <>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Historique
          </p>
          <div className="space-y-2">
            {occupantsPasses.map((l) => (
              <div
                key={l.id}
                className="border border-slate-100 rounded-lg p-3 text-sm text-slate-500"
              >
                <p>
                  {l.salaries?.prenom} {l.salaries?.nom} — du{" "}
                  {new Date(l.date_entree).toLocaleDateString("fr-FR")} au{" "}
                  {l.date_sortie_reelle &&
                    new Date(l.date_sortie_reelle).toLocaleDateString(
                      "fr-FR"
                    )}
                </p>
                {l.montant_caution != null && (
                  <p className="text-xs mt-1">
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
        </>
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
      Aucun état des lieux pour cette chambre.
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
              {edl.sens === "entree" ? "Entrée" : "Sortie"}
              {edl.salaries && ` · ${edl.salaries.prenom} ${edl.salaries.nom}`}
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
  chambreId,
  documents,
}: {
  chambreId: string;
  documents: Document[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [nom, setNom] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!fichier) return;
    setChargement(true);
    setErreur(null);

    const chemin = `${chambreId}/${Date.now()}-${fichier.name}`;
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
      chambre_id: chambreId,
      nom: nom || fichier.name,
      type_document: "divers",
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
        <input
          required
          type="file"
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          className="text-sm"
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
          Aucun document pour cette chambre.
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

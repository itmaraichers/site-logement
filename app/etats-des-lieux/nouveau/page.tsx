"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SignaturePad from "@/components/SignaturePad";
import { genererPdfEtatDesLieux } from "@/lib/pdf-edl";

type TypeEDL = "maison" | "chambre" | null;
type Sens = "entree" | "sortie" | null;

type Maison = { id: string; nom: string };
type Chambre = { id: string; nom: string };
type Salarie = { id: string; nom: string; prenom: string };
type Element = { id: string; nom: string; etat: string; commentaire: string };
type Piece = { id: string; nom: string; elements: Element[] };

const ELEMENTS_PAR_DEFAUT = [
  "Meuble",
  "Matelas",
  "Sommiers",
  "Literie",
  "Lumière",
  "Chauffage",
  "Prise électrique",
  "Mur",
  "Sol",
  "Plafond",
  "Porte",
  "Poignée",
  "Serrure",
  "Fenêtre",
  "Volet",
  "Poignée fenêtre",
  "Propreté",
];

function nouveauxElements(): Element[] {
  return ELEMENTS_PAR_DEFAUT.map((nom, i) => ({
    id: `e${Date.now()}${i}`,
    nom,
    etat: "Bon",
    commentaire: "",
  }));
}

function nouvellePiece(nom: string): Piece {
  return { id: `p${Date.now()}${Math.random()}`, nom, elements: nouveauxElements() };
}

const PIECES_PAR_DEFAUT_CHAMBRE = ["Chambre"];
const PIECES_PAR_DEFAUT_MAISON = ["Salon", "Cuisine", "Salle de bain", "Entrée"];
const ETATS = ["Bon", "Moyen", "Mauvais", "N/A"];

export default function NouvelEtatDesLieuxPage() {
  const router = useRouter();
  const supabase = createClient();

  const [etape, setEtape] = useState(1);
  const [typeEDL, setTypeEDL] = useState<TypeEDL>(null);
  const [sens, setSens] = useState<Sens>(null);

  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [salaries, setSalaries] = useState<Salarie[]>([]);

  const [maisonId, setMaisonId] = useState("");
  const [chambreId, setChambreId] = useState("");
  const [salarieId, setSalarieId] = useState("");

  const [pieces, setPieces] = useState<Piece[]>([]);
  const [pieceOuverte, setPieceOuverte] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [observationsSalarie, setObservationsSalarie] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(
    null
  );

  const [chargement, setChargement] = useState(false);
  const [etapeChargement, setEtapeChargement] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (etape === 2 && maisons.length === 0) {
      supabase
        .from("maisons")
        .select("id, nom")
        .eq("actif", true)
        .order("nom")
        .then(({ data }) => setMaisons(data ?? []));
    }
  }, [etape]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeEDL === "chambre" && maisonId) {
      supabase
        .from("chambres")
        .select("id, nom")
        .eq("maison_id", maisonId)
        .order("nom")
        .then(({ data }) => setChambres(data ?? []));
    }
  }, [maisonId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeEDL !== "chambre") return;

    if (sens === "sortie" && chambreId) {
      supabase
        .from("logements")
        .select("salaries(id, nom, prenom)")
        .eq("chambre_id", chambreId)
        .is("date_sortie_reelle", null)
        .then(({ data }) => {
          setSalaries(
            (data ?? []).map((l: any) => l.salaries).filter(Boolean)
          );
        });
    } else {
      supabase
        .from("salaries")
        .select("id, nom, prenom")
        .eq("actif", true)
        .order("nom")
        .then(({ data }) => setSalaries(data ?? []));
    }
  }, [chambreId, sens, typeEDL]); // eslint-disable-line react-hooks/exhaustive-deps

  function ajouterPiece() {
    const nouvelle = nouvellePiece("");
    setPieces([...pieces, nouvelle]);
    setPieceOuverte(nouvelle.id);
  }

  function renommerPiece(id: string, nom: string) {
    setPieces(pieces.map((p) => (p.id === id ? { ...p, nom } : p)));
  }

  function supprimerPiece(id: string) {
    setPieces(pieces.filter((p) => p.id !== id));
  }

  function modifierElement(
    pieceId: string,
    elementId: string,
    champ: "etat" | "commentaire" | "nom",
    valeur: string
  ) {
    setPieces(
      pieces.map((p) =>
        p.id !== pieceId
          ? p
          : {
              ...p,
              elements: p.elements.map((e) =>
                e.id === elementId ? { ...e, [champ]: valeur } : e
              ),
            }
      )
    );
  }

  function ajouterElement(pieceId: string) {
    setPieces(
      pieces.map((p) =>
        p.id !== pieceId
          ? p
          : {
              ...p,
              elements: [
                ...p.elements,
                {
                  id: `e${Date.now()}`,
                  nom: "",
                  etat: "Bon",
                  commentaire: "",
                },
              ],
            }
      )
    );
  }

  function supprimerElement(pieceId: string, elementId: string) {
    setPieces(
      pieces.map((p) =>
        p.id !== pieceId
          ? p
          : { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
      )
    );
  }

  async function valider() {
    setChargement(true);
    setErreur(null);

    const dateEdl = new Date().toISOString().slice(0, 10);

    // 1. Upload des photos
    setEtapeChargement("Envoi des photos...");
    const photosUrls: string[] = [];
    if (photos) {
      for (const fichier of Array.from(photos)) {
        const chemin = `${maisonId}/${Date.now()}-${fichier.name}`;
        const { error: uploadError } = await supabase.storage
          .from("edl-photos")
          .upload(chemin, fichier);
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("edl-photos").getPublicUrl(chemin);
          photosUrls.push(publicUrl);
        }
      }
    }

    // 2. Upload de la signature
    let signatureUrl: string | null = null;
    if (signatureDataUrl) {
      setEtapeChargement("Enregistrement de la signature...");
      const blobSignature = await (await fetch(signatureDataUrl)).blob();
      const cheminSignature = `${maisonId}/signature-${Date.now()}.png`;
      const { error: sigError } = await supabase.storage
        .from("edl-photos")
        .upload(cheminSignature, blobSignature);
      if (!sigError) {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("edl-photos")
          .getPublicUrl(cheminSignature);
        signatureUrl = publicUrl;
      }
    }

    // 3. Génération du PDF
    setEtapeChargement("Génération du PDF...");
    const maisonNom = maisons.find((m) => m.id === maisonId)?.nom ?? "";
    const chambreNom = chambres.find((c) => c.id === chambreId)?.nom;
    const salarieObj = salaries.find((s) => s.id === salarieId);
    const salarieNomComplet = salarieObj
      ? `${salarieObj.prenom} ${salarieObj.nom}`
      : undefined;

    let pdfUrl: string | null = null;
    try {
      const pdfBlob = await genererPdfEtatDesLieux({
        typeEDL: typeEDL as "maison" | "chambre",
        sens: sens as "entree" | "sortie",
        maisonNom,
        chambreNom,
        salarieNom: salarieNomComplet,
        dateEdl,
        pieces,
        commentaireGeneral: commentaire,
        observationsSalarie,
        signatureDataUrl,
        photosUrls,
      });

      const cheminPdf = `${maisonId}/edl-${Date.now()}.pdf`;
      const { error: pdfError } = await supabase.storage
        .from("edl-pdf")
        .upload(cheminPdf, pdfBlob, { contentType: "application/pdf" });

      if (!pdfError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("edl-pdf").getPublicUrl(cheminPdf);
        pdfUrl = publicUrl;
      }
    } catch {
      // si la génération PDF échoue, on continue quand même l'enregistrement
    }

    // 4. Insertion de l'état des lieux
    setEtapeChargement("Enregistrement...");
    const { error: insertError } = await supabase.from("etats_des_lieux").insert({
      type_edl: typeEDL,
      sens,
      maison_id: maisonId,
      chambre_id: typeEDL === "chambre" ? chambreId : null,
      salarie_id: typeEDL === "chambre" ? salarieId || null : null,
      date_edl: dateEdl,
      donnees: {
        pieces,
        commentaire,
        observations_salarie: observationsSalarie,
      },
      photos: photosUrls,
      signature_url: signatureUrl,
      pdf_url: pdfUrl,
    });

    if (insertError) {
      setErreur(insertError.message);
      setChargement(false);
      return;
    }

    // 5. Sortie : clôture automatique du logement
    if (typeEDL === "chambre" && sens === "sortie" && salarieId) {
      await supabase
        .from("logements")
        .update({ date_sortie_reelle: dateEdl })
        .eq("salarie_id", salarieId)
        .eq("chambre_id", chambreId)
        .is("date_sortie_reelle", null);
    }

    // 5bis. Entrée : création automatique du logement
    if (typeEDL === "chambre" && sens === "entree" && salarieId) {
      const { data: logementExistant } = await supabase
        .from("logements")
        .select("id")
        .eq("salarie_id", salarieId)
        .eq("chambre_id", chambreId)
        .is("date_sortie_reelle", null)
        .maybeSingle();

      if (!logementExistant) {
        const { error: logementError } = await supabase
          .from("logements")
          .insert({
            salarie_id: salarieId,
            chambre_id: chambreId,
            maison_id: maisonId,
            date_entree: dateEdl,
          });

        if (logementError) {
          setErreur(
            logementError.message.includes("uniq_logement_actif_salarie")
              ? "L'état des lieux a été enregistré (PDF disponible), mais ce salarié est déjà logé ailleurs actuellement : son affectation à cette chambre n'a pas pu être créée automatiquement."
              : logementError.message
          );
          setChargement(false);
          return;
        }
      }
    }

    setChargement(false);

    if (typeEDL === "chambre" && chambreId) {
      router.push(`/chambres/${chambreId}`);
    } else {
      router.push(`/maisons/${maisonId}`);
    }
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        Créer un état des lieux
      </h1>
      <p className="text-slate-500 mb-6">Étape {etape} / 4</p>

      {etape === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <p className="font-medium text-slate-700 mb-2">
            Choisir le type d'état des lieux
          </p>
          <button
            onClick={() => {
              setTypeEDL("maison");
              const nouvellesPieces = PIECES_PAR_DEFAUT_MAISON.map((nom) =>
                nouvellePiece(nom)
              );
              setPieces(nouvellesPieces);
              setPieceOuverte(nouvellesPieces[0]?.id ?? null);
              setEtape(2);
            }}
            className="w-full text-left px-4 py-3 rounded-md border border-slate-300 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            🏠 État des lieux maison
          </button>
          <button
            onClick={() => {
              setTypeEDL("chambre");
              const nouvellesPieces = PIECES_PAR_DEFAUT_CHAMBRE.map((nom) =>
                nouvellePiece(nom)
              );
              setPieces(nouvellesPieces);
              setPieceOuverte(nouvellesPieces[0]?.id ?? null);
              setEtape(2);
            }}
            className="w-full text-left px-4 py-3 rounded-md border border-slate-300 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            🛏️ État des lieux chambre
          </button>
        </div>
      )}

      {etape === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <p className="font-medium text-slate-700">
            Choisir les éléments concernés
          </p>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Sens de l'état des lieux
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSens("entree")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  sens === "entree"
                    ? "bg-primary-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Entrée
              </button>
              <button
                onClick={() => setSens("sortie")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  sens === "sortie"
                    ? "bg-primary-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Sortie
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Maison
            </label>
            <select
              value={maisonId}
              onChange={(e) => {
                setMaisonId(e.target.value);
                setChambreId("");
                setSalarieId("");
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Choisir une maison...</option>
              {maisons.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>

          {typeEDL === "chambre" && maisonId && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Chambre
              </label>
              <select
                value={chambreId}
                onChange={(e) => {
                  setChambreId(e.target.value);
                  setSalarieId("");
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Choisir une chambre...</option>
                {chambres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {typeEDL === "chambre" && chambreId && sens && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Salarié
                {sens === "sortie" &&
                  " (occupants actuels de cette chambre)"}
              </label>
              <select
                value={salarieId}
                onChange={(e) => setSalarieId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Choisir un salarié...</option>
                {salaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prenom} {s.nom}
                  </option>
                ))}
              </select>
              {sens === "sortie" && salaries.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Aucun occupant actuel dans cette chambre.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setEtape(1)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              Retour
            </button>
            <button
              disabled={
                !sens ||
                !maisonId ||
                (typeEDL === "chambre" && (!chambreId || !salarieId))
              }
              onClick={() => setEtape(3)}
              className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {etape === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-700">Pièce par pièce</p>
            <button
              onClick={ajouterPiece}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Ajouter une pièce
            </button>
          </div>

          <div className="space-y-2">
            {pieces.map((piece) => {
              const ouverte = pieceOuverte === piece.id;
              return (
                <div
                  key={piece.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2">
                    <button
                      onClick={() =>
                        setPieceOuverte(ouverte ? null : piece.id)
                      }
                      className="text-slate-400"
                    >
                      {ouverte ? "▾" : "▸"}
                    </button>
                    <input
                      placeholder="Nom de la pièce (ex: Chambre)"
                      value={piece.nom}
                      onChange={(e) =>
                        renommerPiece(piece.id, e.target.value)
                      }
                      className="flex-1 bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">
                      {piece.elements.length} élément
                      {piece.elements.length > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => supprimerPiece(piece.id)}
                      className="text-red-500 hover:text-red-700 px-1"
                      title="Supprimer cette pièce"
                    >
                      ✕
                    </button>
                  </div>

                  {ouverte && (
                    <div className="p-3 space-y-2">
                      {piece.elements.map((el) => (
                        <div
                          key={el.id}
                          className="grid grid-cols-[1fr_100px_1fr_auto] gap-2 items-center"
                        >
                          <input
                            value={el.nom}
                            onChange={(e) =>
                              modifierElement(
                                piece.id,
                                el.id,
                                "nom",
                                e.target.value
                              )
                            }
                            className="text-sm rounded-md border border-slate-300 px-2 py-1.5"
                          />
                          <select
                            value={el.etat}
                            onChange={(e) =>
                              modifierElement(
                                piece.id,
                                el.id,
                                "etat",
                                e.target.value
                              )
                            }
                            className="text-sm rounded-md border border-slate-300 px-2 py-1.5"
                          >
                            {ETATS.map((e) => (
                              <option key={e} value={e}>
                                {e}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="Commentaire (optionnel)"
                            value={el.commentaire}
                            onChange={(e) =>
                              modifierElement(
                                piece.id,
                                el.id,
                                "commentaire",
                                e.target.value
                              )
                            }
                            className="text-sm rounded-md border border-slate-300 px-2 py-1.5"
                          />
                          <button
                            onClick={() => supprimerElement(piece.id, el.id)}
                            className="text-red-400 hover:text-red-600 text-sm px-1"
                            title="Retirer cet élément"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => ajouterElement(piece.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium pt-1"
                      >
                        + Ajouter un élément
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Commentaires généraux
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Observations du salarié
            </label>
            <textarea
              value={observationsSalarie}
              onChange={(e) => setObservationsSalarie(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotos(e.target.files)}
              className="text-sm"
            />
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setEtape(2)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              Retour
            </button>
            <button
              onClick={() => setEtape(4)}
              className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {etape === 4 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <p className="font-medium text-slate-700">Signature et validation</p>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-sm text-slate-700 space-y-1">
            <p>
              <strong>Type :</strong>{" "}
              {typeEDL === "maison" ? "Maison" : "Chambre"} —{" "}
              {sens === "entree" ? "Entrée" : "Sortie"}
            </p>
            <p>
              <strong>Maison :</strong>{" "}
              {maisons.find((m) => m.id === maisonId)?.nom}
            </p>
            {typeEDL === "chambre" && (
              <>
                <p>
                  <strong>Chambre :</strong>{" "}
                  {chambres.find((c) => c.id === chambreId)?.nom}
                </p>
                <p>
                  <strong>Salarié :</strong>{" "}
                  {(() => {
                    const s = salaries.find((s) => s.id === salarieId);
                    return s ? `${s.prenom} ${s.nom}` : "—";
                  })()}
                </p>
              </>
            )}
            <p>
              <strong>Pièces renseignées :</strong> {pieces.length}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Signature
            </label>
            <SignaturePad onChange={setSignatureDataUrl} />
          </div>

          {sens === "sortie" && typeEDL === "chambre" && (
            <p className="text-amber-700 text-sm">
              ⚠️ Valider clôturera automatiquement le logement de ce salarié
              (date de départ = aujourd'hui).
            </p>
          )}
          {sens === "entree" && typeEDL === "chambre" && (
            <p className="text-amber-700 text-sm">
              ⚠️ Valider affectera automatiquement ce salarié à cette
              chambre (date d'entrée = aujourd'hui), s'il n'y est pas déjà.
            </p>
          )}

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setEtape(3)}
              disabled={chargement}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              Retour
            </button>
            <button
              onClick={valider}
              disabled={chargement}
              className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
            >
              {chargement
                ? etapeChargement || "Enregistrement..."
                : "Valider et générer le PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

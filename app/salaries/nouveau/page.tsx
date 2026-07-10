"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NouveauSalariePage() {
  const router = useRouter();
  const supabase = createClient();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [dateEntreeEntreprise, setDateEntreeEntreprise] = useState("");
  const [dateDebutContrat, setDateDebutContrat] = useState("");
  const [dateFinContrat, setDateFinContrat] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { data, error } = await supabase
      .from("salaries")
      .insert({
        nom,
        prenom,
        telephone: telephone || null,
        date_naissance: dateNaissance || null,
        date_entree_entreprise: dateEntreeEntreprise || null,
        date_debut_contrat: dateDebutContrat || null,
        date_fin_contrat: dateFinContrat || null,
      })
      .select()
      .single();

    setChargement(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    router.push(`/salaries/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Ajouter un salarié
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prénom *
            </label>
            <input
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom *
            </label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Téléphone
          </label>
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date de naissance
          </label>
          <input
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <p className="text-xs text-slate-400 -mt-2">
          La date d'entrée dans la chambre se règle automatiquement quand tu
          ajoutes ce salarié à une chambre (onglet Occupants d'une fiche
          chambre).
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Début de contrat
            </label>
            <input
              type="date"
              value={dateDebutContrat}
              onChange={(e) => setDateDebutContrat(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fin de contrat
            </label>
            <input
              type="date"
              value={dateFinContrat}
              onChange={(e) => setDateFinContrat(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={chargement}
            className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {chargement ? "Création..." : "Créer le salarié"}
          </button>
        </div>
      </form>
    </div>
  );
}

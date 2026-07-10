"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ModifierSalariePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [chargementInitial, setChargementInitial] = useState(true);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [dateEntreeEntreprise, setDateEntreeEntreprise] = useState("");
  const [dateSortieEntreprise, setDateSortieEntreprise] = useState("");
  const [dateDebutContrat, setDateDebutContrat] = useState("");
  const [dateFinContrat, setDateFinContrat] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from("salaries")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) {
        setNom(data.nom);
        setPrenom(data.prenom);
        setTelephone(data.telephone ?? "");
        setDateNaissance(data.date_naissance ?? "");
        setDateEntreeEntreprise(data.date_entree_entreprise ?? "");
        setDateSortieEntreprise(data.date_sortie_entreprise ?? "");
        setDateDebutContrat(data.date_debut_contrat ?? "");
        setDateFinContrat(data.date_fin_contrat ?? "");
      }
      setChargementInitial(false);
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { error } = await supabase
      .from("salaries")
      .update({
        nom,
        prenom,
        telephone: telephone || null,
        date_naissance: dateNaissance || null,
        date_entree_entreprise: dateEntreeEntreprise || null,
        date_sortie_entreprise: dateSortieEntreprise || null,
        date_debut_contrat: dateDebutContrat || null,
        date_fin_contrat: dateFinContrat || null,
      })
      .eq("id", params.id);

    setChargement(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    router.push(`/salaries/${params.id}`);
    router.refresh();
  }

  if (chargementInitial) {
    return <p className="text-slate-500">Chargement...</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Modifier le salarié
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

        <p className="text-xs text-slate-400">
          La date d'entrée dans la chambre se règle depuis l'onglet
          Occupants d'une fiche chambre, pas ici.
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
            {chargement ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

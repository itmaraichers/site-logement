"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NouvelleMaisonPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [proprietaireNom, setProprietaireNom] = useState("");
  const [proprietaireContact, setProprietaireContact] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { data, error } = await supabase
      .from("maisons")
      .insert({
        nom,
        adresse: adresse || null,
        proprietaire_nom: proprietaireNom || null,
        proprietaire_contact: proprietaireContact || null,
      })
      .select()
      .single();

    setChargement(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    router.push(`/maisons/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Ajouter une maison
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nom de la maison *
          </label>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Maison 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Adresse
          </label>
          <input
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nom du propriétaire
          </label>
          <input
            value={proprietaireNom}
            onChange={(e) => setProprietaireNom(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Coordonnées du propriétaire
          </label>
          <input
            value={proprietaireContact}
            onChange={(e) => setProprietaireContact(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Téléphone ou email"
          />
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
            {chargement ? "Création..." : "Créer la maison"}
          </button>
        </div>
      </form>
    </div>
  );
}

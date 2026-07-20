"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ModifierChambrePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [chargementInitial, setChargementInitial] = useState(true);
  const [maisonNom, setMaisonNom] = useState("");
  const [nom, setNom] = useState("");
  const [capacite, setCapacite] = useState(1);
  const [description, setDescription] = useState("");
  const [mobilier, setMobilier] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from("chambres")
        .select("*, maisons(nom)")
        .eq("id", params.id)
        .single();

      if (data) {
        setNom(data.nom);
        setCapacite(data.capacite);
        setDescription(data.description ?? "");
        setMobilier(data.mobilier ?? "");
        setMaisonNom((data.maisons as any)?.nom ?? "");
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
      .from("chambres")
      .update({
        nom,
        capacite,
        description: description || null,
        mobilier: mobilier || null,
      })
      .eq("id", params.id);

    setChargement(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    router.push(`/chambres/${params.id}`);
    router.refresh();
  }

  if (chargementInitial) {
    return <p className="text-slate-500">Chargement...</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        Modifier la chambre
      </h1>
      <p className="text-slate-500 mb-6">{maisonNom}</p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nom / numéro de chambre *
          </label>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Capacité *
          </label>
          <input
            required
            type="number"
            min={1}
            value={capacite}
            onChange={(e) => setCapacite(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mobilier présent
          </label>
          <input
            value={mobilier}
            onChange={(e) => setMobilier(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            {chargement ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

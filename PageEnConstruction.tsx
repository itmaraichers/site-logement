import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MaisonsListe from "@/components/MaisonsListe";

export default async function MaisonsPage() {
  const supabase = createClient();

  const { data: maisons, error } = await supabase
    .from("v_maisons_resume")
    .select("*")
    .order("nom");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Maisons</h1>
          <p className="text-slate-500">
            {maisons?.length ?? 0} maison{(maisons?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/maisons/nouveau"
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          + Ajouter une maison
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <MaisonsListe maisons={maisons ?? []} />
    </div>
  );
}

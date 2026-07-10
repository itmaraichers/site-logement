import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EtatsDesLieuxListe from "@/components/EtatsDesLieuxListe";

export default async function EtatsDesLieuxPage() {
  const supabase = createClient();

  const [{ data: etatsDesLieux, error }, { data: maisons }] =
    await Promise.all([
      supabase
        .from("etats_des_lieux")
        .select("*, maisons(nom), chambres(id, nom), salaries(nom, prenom)")
        .order("date_edl", { ascending: false }),
      supabase.from("maisons").select("id, nom").order("nom"),
    ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            États des lieux
          </h1>
          <p className="text-slate-500">
            {etatsDesLieux?.length ?? 0} état
            {(etatsDesLieux?.length ?? 0) > 1 ? "s" : ""} des lieux
            enregistré{(etatsDesLieux?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/etats-des-lieux/nouveau"
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          + Créer un état des lieux
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <EtatsDesLieuxListe
        etatsDesLieux={(etatsDesLieux as any) ?? []}
        maisons={maisons ?? []}
      />
    </div>
  );
}

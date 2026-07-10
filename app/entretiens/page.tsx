import { createClient } from "@/lib/supabase/server";
import EntretiensListe from "@/components/EntretiensListe";

export default async function EntretiensPage() {
  const supabase = createClient();

  const [{ data: entretiens, error }, { data: maisons }, { data: parametres }] =
    await Promise.all([
      supabase
        .from("entretiens")
        .select("*, maisons(nom)")
        .order("prochaine_date", { ascending: true }),
      supabase.from("maisons").select("id, nom").order("nom"),
      supabase
        .from("parametres_notification")
        .select("seuil_alerte_jours")
        .eq("id", 1)
        .single(),
    ]);

  const types = Array.from(
    new Set(
      (entretiens ?? [])
        .map((e) => e.type_entretien_libelle)
        .filter((t): t is string => !!t)
    )
  ).sort();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Entretiens</h1>
        <p className="text-slate-500">
          {entretiens?.length ?? 0} entretien
          {(entretiens?.length ?? 0) > 1 ? "s" : ""} sur toutes les maisons
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <EntretiensListe
        entretiens={(entretiens as any) ?? []}
        maisons={maisons ?? []}
        types={types}
        seuilAlerteJours={parametres?.seuil_alerte_jours ?? 30}
      />
    </div>
  );
}

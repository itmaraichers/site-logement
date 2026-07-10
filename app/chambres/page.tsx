import { createClient } from "@/lib/supabase/server";
import ChambresListe from "@/components/ChambresListe";

export default async function ChambresPage() {
  const supabase = createClient();

  const [{ data: chambres, error }, { data: statuts }] = await Promise.all([
    supabase
      .from("chambres")
      .select("id, nom, capacite, maison_id, maisons(nom)")
      .order("nom"),
    supabase.from("v_chambres_statut").select("*"),
  ]);

  const chambresAvecStatut = (chambres ?? []).map((c: any) => {
    const s = statuts?.find((s) => s.chambre_id === c.id);
    return {
      chambre_id: c.id,
      maison_id: c.maison_id,
      nom: c.nom,
      capacite: c.capacite,
      maisons: c.maisons,
      nb_occupants_actuels: s?.nb_occupants_actuels ?? 0,
      statut: s?.statut ?? "libre",
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Chambres</h1>
        <p className="text-slate-500">
          {chambresAvecStatut.length} chambre
          {chambresAvecStatut.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <ChambresListe chambres={chambresAvecStatut} />
    </div>
  );
}

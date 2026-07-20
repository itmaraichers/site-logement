import { createClient } from "@/lib/supabase/server";
import CautionsListe from "@/components/CautionsListe";

export default async function CautionsPage() {
  const supabase = createClient();

  const { data: cautions, error } = await supabase
    .from("logements")
    .select(
      "id, salarie_id, montant_caution, date_versement_caution, date_sortie_reelle, date_restitution_caution, montant_restitue, salaries(nom, prenom), chambres(nom), maisons(nom)"
    )
    .not("montant_caution", "is", null)
    .order("date_sortie_reelle", { ascending: true, nullsFirst: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Cautions</h1>
        <p className="text-slate-500">
          Suivi des cautions versées, en attente de restitution ou déjà
          restituées.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <CautionsListe cautions={(cautions as any) ?? []} />
    </div>
  );
}

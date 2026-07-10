import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SalariesListe from "@/components/SalariesListe";

export default async function SalariesPage() {
  const supabase = createClient();

  const [{ data: salaries, error }, { data: logementsActifs }] =
    await Promise.all([
      supabase.from("salaries").select("*").order("nom"),
      supabase
        .from("logements")
        .select("salarie_id, date_entree, date_sortie_prevue, chambres(nom), maisons(nom)")
        .is("date_sortie_reelle", null),
    ]);

  const salariesAvecLogement = (salaries ?? []).map((s) => {
    const logement = logementsActifs?.find((l) => l.salarie_id === s.id);
    return {
      id: s.id,
      nom: s.nom,
      prenom: s.prenom,
      telephone: s.telephone,
      actif: s.actif,
      logement: logement
        ? {
            date_entree: logement.date_entree,
            date_sortie_prevue: logement.date_sortie_prevue,
            chambre_nom: (logement.chambres as any)?.nom ?? null,
            maison_nom: (logement.maisons as any)?.nom ?? null,
          }
        : null,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Salariés</h1>
          <p className="text-slate-500">
            {salariesAvecLogement.length} salarié
            {salariesAvecLogement.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/salaries/nouveau"
          className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          + Ajouter un salarié
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <SalariesListe salaries={salariesAvecLogement} />
    </div>
  );
}

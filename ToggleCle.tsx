import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FicheMaisonTabs from "@/components/FicheMaisonTabs";
import ToggleActifMaison from "@/components/ToggleActifMaison";
import BoutonSupprimer from "@/components/BoutonSupprimer";
import GaleriePhotos from "@/components/GaleriePhotos";

export default async function FicheMaisonPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const maisonId = params.id;

  const { data: maison } = await supabase
    .from("maisons")
    .select("*")
    .eq("id", maisonId)
    .single();

  if (!maison) notFound();

  const [
    { data: chambres },
    { data: typesEntretien },
    { data: entretiens },
    { data: documents },
    { data: notes },
    { data: etatsDesLieux },
  ] = await Promise.all([
    supabase
      .from("v_chambres_statut")
      .select("*")
      .eq("maison_id", maisonId)
      .order("nom"),
    supabase.from("types_entretien").select("*").eq("actif", true).order("nom"),
    supabase
      .from("entretiens")
      .select("*")
      .eq("maison_id", maisonId)
      .order("prochaine_date", { ascending: true }),
    supabase
      .from("documents")
      .select("*")
      .eq("maison_id", maisonId)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("maison_id", maisonId)
      .order("created_at", { ascending: false }),
    supabase
      .from("etats_des_lieux")
      .select("*, salaries(nom, prenom), chambres(nom)")
      .eq("maison_id", maisonId)
      .order("date_edl", { ascending: false }),
  ]);

  return (
    <div>
      <Link
        href="/maisons"
        className="text-sm text-slate-500 hover:text-primary-600 mb-3 inline-block"
      >
        ← Retour aux maisons
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              {maison.nom}
            </h1>
            {maison.adresse && (
              <p className="text-slate-500">{maison.adresse}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ToggleActifMaison maisonId={maison.id} actif={maison.actif} />
            <Link
              href={`/maisons/${maison.id}/modifier`}
              className="text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
              ✏️ Modifier
            </Link>
            <BoutonSupprimer
              table="maisons"
              id={maison.id}
              redirectTo="/maisons"
              messageConfirmation={`Supprimer "${maison.nom}" supprimera aussi définitivement toutes ses chambres, entretiens, documents, notes et états des lieux liés, et retirera les salariés qui y étaient logés. Continuer ?`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
          <div>
            <p className="text-slate-400">Propriétaire</p>
            <p className="text-slate-700 font-medium">
              {maison.proprietaire_nom || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Contact propriétaire</p>
            <p className="text-slate-700 font-medium">
              {maison.proprietaire_contact || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Chambres</p>
            <p className="text-slate-700 font-medium">
              {chambres?.length ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-2">Photos</p>
          <GaleriePhotos
            table="maisons"
            id={maison.id}
            photos={maison.photos ?? []}
            dossierStorage="maisons"
          />
        </div>
      </div>

      <FicheMaisonTabs
        maisonId={maison.id}
        chambres={chambres ?? []}
        typesEntretien={typesEntretien ?? []}
        entretiens={entretiens ?? []}
        documents={documents ?? []}
        notes={notes ?? []}
        etatsDesLieux={etatsDesLieux ?? []}
      />
    </div>
  );
}

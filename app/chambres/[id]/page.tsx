import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FicheChambreTabs from "@/components/FicheChambreTabs";
import BoutonSupprimer from "@/components/BoutonSupprimer";
import GaleriePhotos from "@/components/GaleriePhotos";

export default async function FicheChambrePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const chambreId = params.id;

  const { data: chambre } = await supabase
    .from("chambres")
    .select("*, maisons(id, nom)")
    .eq("id", chambreId)
    .single();

  if (!chambre) notFound();

  const [
    { data: logements },
    { data: salaries },
    { data: documents },
    { data: etatsDesLieux },
  ] = await Promise.all([
    supabase
      .from("logements")
      .select("*, salaries(id, nom, prenom)")
      .eq("chambre_id", chambreId)
      .order("date_entree", { ascending: false }),
    supabase.from("salaries").select("id, nom, prenom").eq("actif", true).order("nom"),
    supabase
      .from("documents")
      .select("*")
      .eq("chambre_id", chambreId)
      .order("created_at", { ascending: false }),
    supabase
      .from("etats_des_lieux")
      .select("*, salaries(nom, prenom)")
      .eq("chambre_id", chambreId)
      .order("date_edl", { ascending: false }),
  ]);

  const occupantsActuels = (logements ?? []).filter(
    (l) => !l.date_sortie_reelle
  );
  const occupantsPasses = (logements ?? []).filter(
    (l) => l.date_sortie_reelle
  );

  return (
    <div>
      <Link
        href={`/maisons/${chambre.maisons?.id}`}
        className="text-sm text-slate-500 hover:text-primary-600 mb-3 inline-block"
      >
        ← Retour à {chambre.maisons?.nom}
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            {chambre.nom}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/chambres/${chambre.id}/modifier`}
              className="text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
              ✏️ Modifier
            </Link>
            <BoutonSupprimer
              table="chambres"
              id={chambre.id}
              redirectTo={`/maisons/${chambre.maisons?.id}`}
              messageConfirmation={`Supprimer "${chambre.nom}" supprimera aussi ses documents et états des lieux liés, et retirera les salariés qui y étaient logés. Continuer ?`}
            />
          </div>
        </div>
        <p className="text-slate-500 mb-4">{chambre.maisons?.nom}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
          <div>
            <p className="text-slate-400">Capacité</p>
            <p className="text-slate-700 font-medium">{chambre.capacite}</p>
          </div>
          <div>
            <p className="text-slate-400">Occupants actuels</p>
            <p className="text-slate-700 font-medium">
              {occupantsActuels.length} / {chambre.capacite}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Mobilier</p>
            <p className="text-slate-700 font-medium">
              {chambre.mobilier || "—"}
            </p>
          </div>
        </div>
        {chambre.description && (
          <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
            {chambre.description}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-2">Photos</p>
          <GaleriePhotos
            table="chambres"
            id={chambre.id}
            photos={chambre.photos ?? []}
            dossierStorage="chambres"
          />
        </div>
      </div>

      <FicheChambreTabs
        chambreId={chambre.id}
        maisonId={chambre.maisons?.id}
        capacite={chambre.capacite}
        occupantsActuels={occupantsActuels as any}
        occupantsPasses={occupantsPasses as any}
        salariesDisponibles={salaries ?? []}
        documents={documents ?? []}
        etatsDesLieux={(etatsDesLieux as any) ?? []}
      />
    </div>
  );
}

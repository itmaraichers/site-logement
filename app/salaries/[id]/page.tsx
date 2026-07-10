import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FicheSalarieTabs from "@/components/FicheSalarieTabs";
import ToggleActifSalarie from "@/components/ToggleActifSalarie";
import BoutonSupprimer from "@/components/BoutonSupprimer";

export default async function FicheSalariePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const salarieId = params.id;

  const { data: salarie } = await supabase
    .from("salaries")
    .select("*")
    .eq("id", salarieId)
    .single();

  if (!salarie) notFound();

  const [{ data: logements }, { data: documents }, { data: etatsDesLieux }] =
    await Promise.all([
      supabase
        .from("logements")
        .select("*, chambres(id, nom), maisons(id, nom)")
        .eq("salarie_id", salarieId)
        .order("date_entree", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("salarie_id", salarieId)
        .order("created_at", { ascending: false }),
      supabase
        .from("etats_des_lieux")
        .select("*, maisons(nom), chambres(nom)")
        .eq("salarie_id", salarieId)
        .order("date_edl", { ascending: false }),
    ]);

  const logementActuel = (logements ?? []).find((l) => !l.date_sortie_reelle);
  const historique = (logements ?? []).filter((l) => l.date_sortie_reelle);
  const dernierDepart = historique[0]?.date_sortie_reelle ?? null;

  return (
    <div>
      <Link
        href="/salaries"
        className="text-sm text-slate-500 hover:text-primary-600 mb-3 inline-block"
      >
        ← Retour aux salariés
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              {salarie.prenom} {salarie.nom}
            </h1>
            {salarie.telephone && (
              <p className="text-slate-500">{salarie.telephone}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ToggleActifSalarie salarieId={salarie.id} actif={salarie.actif} />
            <Link
              href={`/salaries/${salarie.id}/modifier`}
              className="text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
              ✏️ Modifier
            </Link>
            <BoutonSupprimer
              table="salaries"
              id={salarie.id}
              redirectTo="/salaries"
              messageConfirmation={`Supprimer "${salarie.prenom} ${salarie.nom}" supprimera aussi son historique de logement et ses documents. Ses états des lieux resteront mais sans lien vers lui. Continuer ?`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
          <div>
            <p className="text-slate-400">Date de naissance</p>
            <p className="text-slate-700 font-medium">
              {salarie.date_naissance
                ? new Date(salarie.date_naissance).toLocaleDateString("fr-FR")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Date d'entrée dans la chambre</p>
            <p className="text-slate-700 font-medium">
              {logementActuel
                ? new Date(logementActuel.date_entree).toLocaleDateString(
                    "fr-FR"
                  )
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Date de départ</p>
            <p className="text-slate-700 font-medium">
              {logementActuel
                ? "—"
                : dernierDepart
                ? new Date(dernierDepart).toLocaleDateString("fr-FR")
                : "—"}
            </p>
            {!logementActuel && (
              <p className="text-xs text-slate-400">
                Se remplit automatiquement lors d'un état des lieux de sortie
              </p>
            )}
          </div>
          <div>
            <p className="text-slate-400">Contrat</p>
            <p className="text-slate-700 font-medium">
              {salarie.date_debut_contrat
                ? new Date(salarie.date_debut_contrat).toLocaleDateString(
                    "fr-FR"
                  )
                : "—"}
              {salarie.date_fin_contrat &&
                ` → ${new Date(salarie.date_fin_contrat).toLocaleDateString(
                  "fr-FR"
                )}`}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Statut</p>
            <p className="text-slate-700 font-medium">
              {salarie.actif ? "Actif" : "Inactif"}
            </p>
          </div>
        </div>
      </div>

      <FicheSalarieTabs
        salarieId={salarie.id}
        logementActuel={logementActuel as any}
        historique={historique as any}
        documents={documents ?? []}
        etatsDesLieux={(etatsDesLieux as any) ?? []}
      />
    </div>
  );
}

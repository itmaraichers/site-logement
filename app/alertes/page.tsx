import { createClient } from "@/lib/supabase/server";
import { getAlertesActives } from "@/lib/alertes";
import AlertesListe from "@/components/AlertesListe";

export default async function AlertesPage() {
  const supabase = createClient();

  const [alertes, { data: parametres }] = await Promise.all([
    getAlertesActives(supabase),
    supabase
      .from("parametres_notification")
      .select("seuil_alerte_jours")
      .eq("id", 1)
      .single(),
  ]);

  const seuil = parametres?.seuil_alerte_jours ?? 30;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Alertes</h1>
        <p className="text-slate-500">
          Entretiens, sorties dépassées, états des lieux manquants, fins de
          contrat et cautions manquantes — calculés à J-{seuil}
        </p>
      </div>

      <AlertesListe alertes={alertes} />
    </div>
  );
}

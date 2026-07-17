import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const supabase = createClient();

  const [
    { data: typesEntretien },
    { data: sites },
    { data: parametres },
    { data: statuts },
    { data: langues },
    { data: modelesDocuments },
  ] = await Promise.all([
    supabase.from("types_entretien").select("*").order("nom"),
    supabase.from("sites").select("*").order("nom"),
    supabase.from("parametres_notification").select("*").eq("id", 1).single(),
    supabase
      .from("statuts_disponibles")
      .select("*")
      .order("categorie")
      .order("valeur"),
    supabase.from("langues_disponibles").select("*").order("libelle"),
    supabase
      .from("modeles_documents")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Panel admin
        </h1>
        <p className="text-slate-500">
          Réglages modifiables sans toucher au code.
        </p>
      </div>

      <AdminPanel
        typesEntretien={typesEntretien ?? []}
        sites={sites ?? []}
        parametres={
          parametres ?? {
            mail_actif: true,
            mail_expediteur: "",
            sms_actif: false,
            seuil_alerte_jours: 30,
          }
        }
        statuts={statuts ?? []}
        langues={langues ?? []}
        modelesDocuments={modelesDocuments ?? []}
      />
    </div>
  );
}

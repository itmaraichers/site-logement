import { createClient } from "@/lib/supabase/server";
import DocumentsListe from "@/components/DocumentsListe";

export default async function DocumentsPage() {
  const supabase = createClient();

  const [{ data: documents, error }, { data: maisons }] = await Promise.all([
    supabase
      .from("documents")
      .select("*, maisons(nom), chambres(nom), salaries(nom, prenom)")
      .order("created_at", { ascending: false }),
    supabase.from("maisons").select("id, nom").order("nom"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <p className="text-slate-500">
          {documents?.length ?? 0} document
          {(documents?.length ?? 0) > 1 ? "s" : ""} au total
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Erreur de chargement : {error.message}
        </p>
      )}

      <DocumentsListe
        documents={(documents as any) ?? []}
        maisons={maisons ?? []}
      />
    </div>
  );
}

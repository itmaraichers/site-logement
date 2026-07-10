-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 7/7 (migration)
-- Politiques RLS pour Supabase Storage : sans ça, rendre un
-- bucket "public" autorise la LECTURE mais pas l'UPLOAD.
-- Les utilisateurs connectés (authenticated) ont besoin d'une
-- politique explicite pour uploader/supprimer des fichiers.
-- =========================================================

create policy "authenticated_full_access_storage"
on storage.objects
for all
to authenticated
using (
  bucket_id in ('maisons-photos', 'edl-photos', 'edl-pdf', 'documents', 'salaries-photos')
)
with check (
  bucket_id in ('maisons-photos', 'edl-photos', 'edl-pdf', 'documents', 'salaries-photos')
);

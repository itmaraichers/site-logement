-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 9/9 (migration)
-- Permet de masquer manuellement une alerte calculée.
-- Les alertes ne sont pas stockées en base (recalculées à
-- chaque chargement) — on stocke juste la liste des ids
-- masqués pour les exclure du calcul.
-- =========================================================

create table if not exists alertes_masquees (
  id text primary key,
  masquee_le timestamptz not null default now()
);

alter table alertes_masquees enable row level security;

create policy "authenticated_full_access" on alertes_masquees
  for all to authenticated using (true) with check (true);

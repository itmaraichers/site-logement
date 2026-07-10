-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 6/6 (migration)
-- Ajout de la gestion des photos pour les chambres
-- (les maisons avaient déjà ce champ dès le fichier 01)
-- =========================================================

alter table chambres add column if not exists photos text[] default '{}';

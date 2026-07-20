-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 12/12 (migration)
-- Suivi de caution : montant, date de versement à l'entrée,
-- date et montant de restitution à la sortie.
-- Rattaché directement au logement (= le séjour), puisque
-- chaque séjour a sa propre caution.
-- =========================================================

alter table logements add column if not exists montant_caution numeric(10,2);
alter table logements add column if not exists date_versement_caution date;
alter table logements add column if not exists date_restitution_caution date;
alter table logements add column if not exists montant_restitue numeric(10,2);

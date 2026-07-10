-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 8/8 (migration)
-- Sépare la signature unique en deux : entreprise + salarié
-- =========================================================

alter table etats_des_lieux rename column signature_url to signature_salarie_url;
alter table etats_des_lieux add column if not exists signature_entreprise_url text;

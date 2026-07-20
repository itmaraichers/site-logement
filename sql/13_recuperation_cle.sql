-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 13/13 (migration)
-- Ajoute la date de récupération de la clé (remise_cles_le
-- existait déjà pour la remise à l'entrée, il manquait son
-- équivalent pour la reprise à la sortie).
-- =========================================================

alter table logements add column if not exists date_recuperation_cle date;

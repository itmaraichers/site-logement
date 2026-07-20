-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 11/11 (migration)
-- Permet des notes internes sur un salarié, pas uniquement
-- sur une maison.
-- =========================================================

alter table notes alter column maison_id drop not null;
alter table notes add column if not exists salarie_id uuid references salaries(id) on delete cascade;

alter table notes add constraint chk_note_rattachement
  check (maison_id is not null or salarie_id is not null);

create index if not exists idx_notes_salarie on notes(salarie_id);

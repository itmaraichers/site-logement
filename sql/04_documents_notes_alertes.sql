-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 4/5
-- Documents, notes internes, alertes
-- =========================================================

-- ---------------------------------------------------------
-- DOCUMENTS
-- Rattaché à au moins un élément (maison, chambre ou salarié).
-- ---------------------------------------------------------
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  type_document text,                       -- 'bail','assurance','diagnostic','facture','photo','contrat','piece_identite','divers', ...
  url text not null,
  maison_id uuid references maisons(id) on delete cascade,
  chambre_id uuid references chambres(id) on delete cascade,
  salarie_id uuid references salaries(id) on delete cascade,
  archive boolean not null default false,
  created_at timestamptz not null default now(),
  constraint chk_document_rattachement check (
    maison_id is not null or chambre_id is not null or salarie_id is not null
  )
);

create index if not exists idx_documents_maison on documents(maison_id);
create index if not exists idx_documents_chambre on documents(chambre_id);
create index if not exists idx_documents_salarie on documents(salarie_id);

-- ---------------------------------------------------------
-- NOTES INTERNES (rattachées à une maison)
-- ---------------------------------------------------------
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  maison_id uuid not null references maisons(id) on delete cascade,
  contenu text not null,
  pieces_jointes text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_notes_maison on notes(maison_id);

-- ---------------------------------------------------------
-- ALERTES
-- Générées par l'appli (entretien proche, EDL manquant, sortie
-- dépassée, document manquant...). entite_type + entite_id
-- pointent vers l'élément concerné.
-- ---------------------------------------------------------
create table if not exists alertes (
  id uuid primary key default uuid_generate_v4(),
  type_alerte text not null,                -- 'entretien_proche','edl_manquant','sortie_depassee','document_manquant', ...
  titre text not null,
  description text,
  entite_type text not null check (entite_type in ('maison', 'chambre', 'salarie', 'entretien')),
  entite_id uuid not null,
  date_echeance date,
  statut text not null default 'active' check (statut in ('active', 'traitee')),
  -- structure prête pour notifications (activation réelle plus tard)
  mail_envoye boolean not null default false,
  sms_envoye boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_alertes_statut on alertes(statut);
create index if not exists idx_alertes_entite on alertes(entite_type, entite_id);

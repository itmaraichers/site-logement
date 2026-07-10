-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 3/5
-- Entretiens (toujours rattachés à une maison) + États des lieux
-- =========================================================

-- ---------------------------------------------------------
-- TYPES D'ENTRETIEN (configurable dans le panel admin)
-- ---------------------------------------------------------
create table if not exists types_entretien (
  id uuid primary key default uuid_generate_v4(),
  nom text not null unique,                 -- ex: "Chaudière", "Ramonage", "Extincteurs"
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

insert into types_entretien (nom) values
  ('Chaudière'), ('Ramonage'), ('Extincteurs'), ('Détecteurs de fumée'), ('Entretien général')
on conflict (nom) do nothing;

-- ---------------------------------------------------------
-- ENTRETIENS
-- ---------------------------------------------------------
create table if not exists entretiens (
  id uuid primary key default uuid_generate_v4(),
  maison_id uuid not null references maisons(id) on delete cascade,
  type_entretien_id uuid references types_entretien(id),
  type_entretien_libelle text,              -- copie du libellé au moment de la saisie (historique)
  date_realisation date,
  prochaine_date date,
  statut text not null default 'a_prevoir'  -- 'a_jour' | 'a_prevoir' | 'en_retard'
    check (statut in ('a_jour', 'a_prevoir', 'en_retard')),
  commentaire text,
  piece_jointe_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entretiens_maison on entretiens(maison_id);
create index if not exists idx_entretiens_prochaine_date on entretiens(prochaine_date);

-- ---------------------------------------------------------
-- ÉTATS DES LIEUX
-- Soit rattaché à une maison seule (type = 'maison'),
-- soit à maison + chambre + salarié (type = 'chambre').
-- ---------------------------------------------------------
create table if not exists etats_des_lieux (
  id uuid primary key default uuid_generate_v4(),
  type_edl text not null check (type_edl in ('maison', 'chambre')),
  sens text not null check (sens in ('entree', 'sortie')),
  maison_id uuid not null references maisons(id) on delete cascade,
  chambre_id uuid references chambres(id) on delete cascade,
  salarie_id uuid references salaries(id) on delete set null,
  date_edl date not null default current_date,
  donnees jsonb default '{}',               -- pièce par pièce, mobilier, commentaires, observations
  photos text[] default '{}',
  signature_url text,
  pdf_url text,
  created_at timestamptz not null default now(),
  -- cohérence : si type = chambre, chambre_id doit être renseigné
  constraint chk_edl_chambre check (
    (type_edl = 'maison') or (type_edl = 'chambre' and chambre_id is not null)
  )
);

create index if not exists idx_edl_maison on etats_des_lieux(maison_id);
create index if not exists idx_edl_chambre on etats_des_lieux(chambre_id);
create index if not exists idx_edl_salarie on etats_des_lieux(salarie_id);

-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 1/5
-- Extensions + tables principales : maisons, chambres, salariés
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- MAISONS
-- ---------------------------------------------------------
create table if not exists maisons (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  adresse text,
  photos text[] default '{}',              -- URLs des photos (stockage Supabase Storage)
  proprietaire_nom text,
  proprietaire_contact text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CHAMBRES
-- ---------------------------------------------------------
create table if not exists chambres (
  id uuid primary key default uuid_generate_v4(),
  maison_id uuid not null references maisons(id) on delete cascade,
  nom text not null,                        -- ex: "Chambre 2"
  capacite int not null default 1,
  description text,
  mobilier text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chambres_maison on chambres(maison_id);

-- ---------------------------------------------------------
-- SALARIÉS
-- Table dédiée (les salariés ne se connectent pas eux-mêmes
-- dans cette v1 — voir note d'architecture).
-- ---------------------------------------------------------
create table if not exists salaries (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  prenom text not null,
  photo_url text,
  date_naissance date,
  telephone text,
  date_entree_entreprise date,
  date_sortie_entreprise date,
  date_debut_contrat date,
  date_fin_contrat date,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_salaries_nom on salaries(nom, prenom);

-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 2/5
-- Logements : occupation actuelle ET historique d'un salarié
-- Une ligne = un séjour d'un salarié dans une chambre.
-- Le séjour "en cours" est celui où date_sortie_reelle est NULL.
-- =========================================================

create table if not exists logements (
  id uuid primary key default uuid_generate_v4(),
  salarie_id uuid not null references salaries(id) on delete cascade,
  chambre_id uuid not null references chambres(id) on delete cascade,
  maison_id uuid not null references maisons(id) on delete cascade, -- dénormalisé pour requêtes rapides
  date_entree date not null,
  date_sortie_prevue date,
  date_sortie_reelle date,                  -- NULL tant que le salarié est présent
  remise_cles_le date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_logements_salarie on logements(salarie_id);
create index if not exists idx_logements_chambre on logements(chambre_id);
create index if not exists idx_logements_maison on logements(maison_id);

-- Un seul séjour "actif" (date_sortie_reelle NULL) par salarié à la fois
create unique index if not exists uniq_logement_actif_salarie
  on logements(salarie_id)
  where date_sortie_reelle is null;

-- Empêche en théorie qu'une chambre ait plus de salariés actifs que sa capacité :
-- pas un contrainte SQL stricte (capacité variable), on gèrera la vérification côté appli.

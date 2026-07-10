-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 5/5
-- Panel admin (paramètres) + vues calculées
-- =========================================================

-- ---------------------------------------------------------
-- STATUTS CONFIGURABLES (admin peut ajouter/renommer sans coder)
-- ---------------------------------------------------------
create table if not exists statuts_disponibles (
  id uuid primary key default uuid_generate_v4(),
  categorie text not null,                  -- 'salarie','maison','chambre','entretien', ...
  valeur text not null,
  libelle text not null,
  actif boolean not null default true,
  unique(categorie, valeur)
);

insert into statuts_disponibles (categorie, valeur, libelle) values
  ('salarie', 'actif', 'Actif'),
  ('salarie', 'inactif', 'Inactif'),
  ('maison', 'actif', 'Active'),
  ('maison', 'inactif', 'Inactive'),
  ('entretien', 'a_jour', 'À jour'),
  ('entretien', 'a_prevoir', 'À prévoir'),
  ('entretien', 'en_retard', 'En retard')
on conflict (categorie, valeur) do nothing;

-- ---------------------------------------------------------
-- LANGUES DISPONIBLES
-- ---------------------------------------------------------
create table if not exists langues_disponibles (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,                -- 'fr', 'en', ...
  libelle text not null,
  actif boolean not null default true
);

insert into langues_disponibles (code, libelle) values ('fr', 'Français')
on conflict (code) do nothing;

-- ---------------------------------------------------------
-- MODÈLES DE DOCUMENTS (admin)
-- ---------------------------------------------------------
create table if not exists modeles_documents (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  type_document text,
  url_modele text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PARAMÈTRES DE NOTIFICATION (mail actif, SMS en préparation)
-- Une seule ligne de config globale pour cette v1 test.
-- ---------------------------------------------------------
create table if not exists parametres_notification (
  id int primary key default 1,
  mail_actif boolean not null default true,
  mail_expediteur text,
  sms_actif boolean not null default false, -- désactivé tant que pas de solution payante
  sms_provider text,                        -- structure prête (ex: 'twilio', futur)
  seuil_alerte_jours int not null default 30, -- alerte à J-30 par défaut
  constraint chk_single_row check (id = 1)
);

insert into parametres_notification (id) values (1)
on conflict (id) do nothing;

-- =========================================================
-- VUES CALCULÉES
-- =========================================================

-- Statut temps réel d'une chambre (libre / occupée) + occupant(s) actuel(s)
create or replace view v_chambres_statut as
select
  c.id as chambre_id,
  c.maison_id,
  c.nom,
  c.capacite,
  count(l.id) filter (where l.date_sortie_reelle is null) as nb_occupants_actuels,
  case
    when count(l.id) filter (where l.date_sortie_reelle is null) = 0 then 'libre'
    when count(l.id) filter (where l.date_sortie_reelle is null) < c.capacite then 'partiellement_occupee'
    else 'occupee'
  end as statut
from chambres c
left join logements l on l.chambre_id = c.id
group by c.id, c.maison_id, c.nom, c.capacite;

-- Résumé maison : nb chambres, nb salariés présents, dernier/prochain entretien
create or replace view v_maisons_resume as
select
  m.id as maison_id,
  m.nom,
  m.adresse,
  m.actif,
  count(distinct ch.id) as nb_chambres,
  count(distinct l.salarie_id) filter (where l.date_sortie_reelle is null) as nb_salaries_presents,
  max(e.date_realisation) as dernier_entretien,
  min(e.prochaine_date) filter (where e.prochaine_date >= current_date) as prochaine_alerte_entretien
from maisons m
left join chambres ch on ch.maison_id = m.id
left join logements l on l.maison_id = m.id
left join entretiens e on e.maison_id = m.id
group by m.id, m.nom, m.adresse, m.actif;

-- Logement actuel de chaque salarié
create or replace view v_salaries_logement_actuel as
select
  s.id as salarie_id,
  s.nom,
  s.prenom,
  s.actif,
  l.chambre_id,
  l.maison_id,
  l.date_entree,
  l.date_sortie_prevue,
  l.remise_cles_le
from salaries s
left join logements l on l.salarie_id = s.id and l.date_sortie_reelle is null;

-- =========================================================
-- RLS — v1 test : accès complet aux utilisateurs authentifiés
-- (à durcir avec des rôles plus tard, cf. panel admin "gérer les droits")
-- =========================================================
alter table maisons enable row level security;
alter table chambres enable row level security;
alter table salaries enable row level security;
alter table logements enable row level security;
alter table entretiens enable row level security;
alter table types_entretien enable row level security;
alter table etats_des_lieux enable row level security;
alter table documents enable row level security;
alter table notes enable row level security;
alter table alertes enable row level security;
alter table statuts_disponibles enable row level security;
alter table langues_disponibles enable row level security;
alter table modeles_documents enable row level security;
alter table parametres_notification enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'maisons','chambres','salaries','logements','entretiens','types_entretien',
    'etats_des_lieux','documents','notes','alertes','statuts_disponibles',
    'langues_disponibles','modeles_documents','parametres_notification'
  ])
  loop
    execute format(
      'create policy "authenticated_full_access" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

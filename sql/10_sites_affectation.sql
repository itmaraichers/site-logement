-- =========================================================
-- GESTION LOGEMENTS SALARIÉS — Fichier 10/10 (migration)
-- Sites d'affectation (configurable) + lien sur les salariés
-- =========================================================

create table if not exists sites (
  id uuid primary key default uuid_generate_v4(),
  nom text not null unique,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table salaries add column if not exists site_id uuid references sites(id) on delete set null;

alter table sites enable row level security;
create policy "authenticated_full_access" on sites
  for all to authenticated using (true) with check (true);

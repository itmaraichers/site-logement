# Gestion Logements Salariés — v1 test

Prototype gratuit : GitHub + Supabase (free) + Vercel (free).

## Mise en place

1. **Supabase**
   - Crée un nouveau projet Supabase (plan gratuit).
   - Va dans SQL Editor et exécute, **dans l'ordre**, les 6 fichiers du dossier `sql/` :
     `01_tables_principales.sql` → `02_logements.sql` → `03_entretiens_edl.sql` →
     `04_documents_notes_alertes.sql` → `05_admin_vues_rls.sql` → `06_photos_chambres.sql`
   - Crée les buckets Storage : `maisons-photos`, `documents`, `edl-photos`, `edl-pdf`, `salaries-photos`.
   - **Rends publics** les buckets `maisons-photos`, `documents`, `edl-photos` et `edl-pdf`
     (Storage → bucket → Edit bucket → Public bucket). Nécessaire pour l'affichage des
     photos, PDF et documents dans l'appli.
   - Dans Authentication → Users, crée manuellement les comptes (toi + les 2-3 collègues). Pas d'inscription publique dans cette v1.

2. **GitHub**
   - Crée un nouveau repo, upload tout le dossier `logements-app/` (drag-and-drop comme d'habitude).

3. **Vercel**
   - Importe le repo GitHub.
   - Ajoute les variables d'environnement (voir `.env.example`) :
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     (Project Settings → API dans Supabase).
   - Déploie.

4. **Keepalive** (optionnel, comme pour SUIVIS-DEMANDES)
   - Ajouter une route `/api/ping` + cron via cron-job.org pour éviter la mise en veille Supabase.

## État actuel

Squelette complet : navigation, auth (login/protection des routes), toutes les pages
créées avec leur structure et leurs onglets prévus, mais **pas encore connectées aux
données** (chaque page indique ce qu'il reste à brancher).

## Prochaine étape

Connecter les pages une par une à Supabase, dans l'ordre suggéré :
Maisons → Chambres → Salariés → États des lieux → Entretiens → Documents → Alertes → Admin.

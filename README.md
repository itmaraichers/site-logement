# Gestion Logements Salariés — v1 test

Stack : GitHub + Supabase (base de données + authentification) + Cloudflare R2
(stockage des fichiers) + Vercel (hébergement).

## Mise en place

1. **Supabase**
   - Crée un nouveau projet Supabase (plan gratuit).
   - Va dans SQL Editor et exécute, **dans l'ordre**, les 8 fichiers du dossier `sql/`
     (`01_tables_principales.sql` → ... → `08_double_signature.sql`).
   - Dans Authentication → Users, crée manuellement les comptes (toi + les 2-3 collègues).
     Pas d'inscription publique dans cette v1.
   - Les buckets Storage Supabase (`maisons-photos`, `documents`, `edl-photos`, `edl-pdf`,
     `salaries-photos`) ne sont **plus utilisés** depuis le passage à Cloudflare R2
     (voir étape 2). Tu peux les laisser tels quels ou les supprimer, ça n'a plus d'impact.

2. **Cloudflare R2** (stockage des photos/documents/PDF — remplace Supabase Storage)
   - Crée un compte gratuit sur cloudflare.com si tu n'en as pas.
   - Dans le dashboard Cloudflare, va dans **R2 Object Storage** (menu de gauche).
   - **Create bucket** → nom : `logements-fichiers` → région : Automatic → Create.
   - Ouvre le bucket créé → onglet **Settings** → section **Public access** → active
     **Allow Access** (ça te donne une URL publique du type `https://pub-xxxxxxxx.r2.dev`,
     à copier — ce sera la variable `R2_PUBLIC_URL`).
   - Toujours dans **Settings** → section **CORS Policy** → **Add CORS policy** → colle
     ceci puis Save (nécessaire pour que les photos s'intègrent dans le PDF généré depuis
     le navigateur) :
     ```json
     [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET"],
         "AllowedHeaders": ["*"]
       }
     ]
     ```
   - Retourne sur la page **R2 Object Storage** → **Manage R2 API Tokens** (en haut à
     droite) → **Create API Token** → permissions **Object Read & Write**, limité au
     bucket `logements-fichiers` → Create. Note bien les valeurs affichées (elles ne
     seront plus jamais visibles après) : **Access Key ID**, **Secret Access Key**, et
     l'**Account ID** (visible dans l'URL du dashboard Cloudflare).

3. **GitHub**
   - Crée un repo, upload tout le contenu du dossier `logements-app/` (via github.dev,
     voir plus bas).

4. **Vercel**
   - Importe le repo GitHub.
   - Ajoute toutes les variables d'environnement listées dans `.env.example` :
     - Les 3 variables Supabase (Project Settings → API dans Supabase)
     - Les 5 variables R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
       `R2_BUCKET_NAME`, `R2_PUBLIC_URL`) avec les valeurs de l'étape 2
   - Déploie.

5. **Keepalive** (optionnel)
   - Ajouter une route `/api/ping` + cron via cron-job.org pour éviter la mise en veille
     du projet Supabase après 7 jours d'inactivité.

## Mettre à jour le code (sans rien installer)

Le plus fiable : **github.dev**. Sur la page du repo, appuie sur la touche `.` (point) —
ça ouvre un éditeur dans le navigateur. Glisse-dépose le contenu du dossier dézippé dans
le panneau de fichiers (les dossiers/sous-dossiers sont respectés, contrairement à
l'upload web classique), puis Source Control → Commit & Push. Vercel redéploie
automatiquement.

## État actuel

Toutes les sections du cahier des charges sont connectées à de vraies données : Maisons,
Chambres, Salariés, États des lieux (pièce par pièce, signatures entreprise + salarié,
génération de PDF), Entretiens, Documents, Alertes, Admin. Le stockage des fichiers
(photos, documents, PDF) passe par Cloudflare R2 plutôt que par Supabase Storage.

## Reste à faire pour une v2 (pas urgent pour la phase de test)

- Solution payante pour l'envoi réel de mail/SMS (structure déjà prête côté base de données)
- Sauvegardes automatiques régulières (recommandé avant d'y stocker des données réelles
  durablement — passer sur Supabase Pro les active)

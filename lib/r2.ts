import { S3Client } from "@aws-sdk/client-s3";

// Ce client n'est utilisé QUE côté serveur (dans app/api/upload/route.ts).
// Les identifiants R2 ne sont donc jamais exposés au navigateur.
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// URL publique de base pour construire les liens de téléchargement
// (ex: https://pub-xxxxx.r2.dev ou un domaine personnalisé)
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

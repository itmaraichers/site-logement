import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Vérifie que la personne est bien connectée avant d'accepter un upload
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fichier = formData.get("file") as File | null;
    const dossier = (formData.get("folder") as string) || "divers";

    if (!fichier) {
      return NextResponse.json(
        { error: "Aucun fichier reçu" },
        { status: 400 }
      );
    }

    const octets = Buffer.from(await fichier.arrayBuffer());
    const nomFichier = `${Date.now()}-${fichier.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const cle = `${dossier}/${nomFichier}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: cle,
        Body: octets,
        ContentType: fichier.type || "application/octet-stream",
      })
    );

    const url = `${R2_PUBLIC_URL}/${cle}`;

    return NextResponse.json({ url });
  } catch (erreur: any) {
    console.error("Erreur upload R2 :", erreur);
    return NextResponse.json(
      { error: erreur?.message ?? "Erreur inconnue" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Le cron externe n'est pas "connecté" (pas de session), donc on utilise
  // la clé service role pour contourner les policies RLS (qui exigent
  // authenticated). Cette route ne renvoie aucune donnée, juste ok/erreur.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Une vraie requête à la base est nécessaire : Supabase ne compte que
  // l'activité base de données pour éviter la mise en pause après 7 jours,
  // pas juste le fait que le site Vercel réponde.
  const { error } = await supabase.from("maisons").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}

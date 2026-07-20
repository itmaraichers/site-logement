"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PhotoProfilSalarie({
  salarieId,
  photoUrl,
  prenom,
}: {
  salarieId: string;
  photoUrl: string | null;
  prenom: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changerPhoto(fichier: File | null) {
    if (!fichier) return;
    setChargement(true);
    setErreur(null);

    const chemin = `${salarieId}/${Date.now()}-${fichier.name}`;
    const { error: uploadError } = await supabase.storage
      .from("salaries-photos")
      .upload(chemin, fichier);

    if (uploadError) {
      setErreur(uploadError.message);
      setChargement(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("salaries-photos").getPublicUrl(chemin);

    await supabase
      .from("salaries")
      .update({ photo_url: publicUrl })
      .eq("id", salarieId);

    setChargement(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="cursor-pointer group relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={prenom}
            className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary-100 border-2 border-slate-200 flex items-center justify-center text-2xl font-semibold text-primary-600">
            {prenom.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity">
            {chargement ? "..." : "✏️"}
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          disabled={chargement}
          onChange={(e) => changerPhoto(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>
      {erreur && (
        <p className="text-xs text-red-600 max-w-[120px] text-center">
          {erreur}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload-client";

export default function GaleriePhotos({
  table,
  id,
  photos,
  dossierStorage,
}: {
  table: "maisons" | "chambres";
  id: string;
  photos: string[];
  dossierStorage: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouterPhotos(fichiers: FileList | null) {
    if (!fichiers || fichiers.length === 0) return;
    setChargement(true);
    setErreur(null);

    const nouvellesUrls: string[] = [];

    for (const fichier of Array.from(fichiers)) {
      try {
        const url = await uploadFile(fichier, `${dossierStorage}/${id}`);
        nouvellesUrls.push(url);
      } catch (e: any) {
        setErreur(e?.message ?? "Erreur lors de l'upload");
      }
    }

    await supabase
      .from(table)
      .update({ photos: [...photos, ...nouvellesUrls] })
      .eq("id", id);

    setChargement(false);
    router.refresh();
  }

  async function supprimerPhoto(url: string) {
    if (!window.confirm("Supprimer cette photo ?")) return;
    setChargement(true);
    await supabase
      .from(table)
      .update({ photos: photos.filter((p) => p !== url) })
      .eq("id", id);
    setChargement(false);
    router.refresh();
  }

  return (
    <div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
          {photos.map((url) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt="Photo"
                className="w-full aspect-square object-cover rounded-md border border-slate-200"
              />
              <button
                onClick={() => supprimerPhoto(url)}
                className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 text-red-600 text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
        {chargement ? "Envoi..." : "+ Ajouter des photos"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={chargement}
          onChange={(e) => ajouterPhotos(e.target.files)}
          className="hidden"
        />
      </label>
      {erreur && <p className="text-sm text-red-600 mt-1">{erreur}</p>}
    </div>
  );
}

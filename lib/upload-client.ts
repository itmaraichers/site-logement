/**
 * Upload un fichier (ou un Blob, ex: PDF/signature générés en mémoire)
 * vers Cloudflare R2 via la route API interne, et retourne son URL publique.
 */
export async function uploadFile(
  fichier: File | Blob,
  dossier: string,
  nomSiPasFile?: string
): Promise<string> {
  const formData = new FormData();
  const nom =
    fichier instanceof File ? fichier.name : nomSiPasFile ?? "fichier";
  formData.append("file", fichier, nom);
  formData.append("folder", dossier);

  const reponse = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!reponse.ok) {
    const data = await reponse.json().catch(() => ({}));
    throw new Error(data.error ?? "Échec de l'upload");
  }

  const { url } = await reponse.json();
  return url as string;
}

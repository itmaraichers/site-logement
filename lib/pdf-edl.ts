import jsPDF from "jspdf";

type Element = { nom: string; etat: string; commentaire: string };
type Piece = { nom: string; elements: Element[] };

export async function genererPdfEtatDesLieux(params: {
  typeEDL: "maison" | "chambre";
  sens: "entree" | "sortie";
  maisonNom: string;
  chambreNom?: string;
  salarieNom?: string;
  dateEdl: string;
  pieces: Piece[];
  commentaireGeneral: string;
  observationsSalarie: string;
  signatureDataUrl: string | null;
  photosUrls: string[];
}): Promise<Blob> {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text("État des lieux", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `${params.typeEDL === "maison" ? "Maison" : "Chambre"} — ${
      params.sens === "entree" ? "Entrée" : "Sortie"
    }`,
    14,
    y
  );
  y += 6;
  doc.text(
    `Date : ${new Date(params.dateEdl).toLocaleDateString("fr-FR")}`,
    14,
    y
  );
  y += 6;
  doc.text(`Maison : ${params.maisonNom}`, 14, y);
  y += 6;
  if (params.chambreNom) {
    doc.text(`Chambre : ${params.chambreNom}`, 14, y);
    y += 6;
  }
  if (params.salarieNom) {
    doc.text(`Salarié : ${params.salarieNom}`, 14, y);
    y += 6;
  }

  y += 4;
  doc.setDrawColor(220);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Pièce par pièce", 14, y);
  y += 7;

  doc.setFontSize(9);
  for (const piece of params.pieces) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(piece.nom || "Pièce", 14, y);
    y += 6;
    doc.setFontSize(9);

    for (const el of piece.elements) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(15, 23, 42);
      const ligneBase = `• ${el.nom || "Élément"} — ${el.etat}`;
      doc.text(ligneBase, 18, y);
      y += 4.5;
      if (el.commentaire) {
        doc.setTextColor(120);
        const lignes = doc.splitTextToSize(el.commentaire, 170);
        doc.text(lignes, 22, y);
        y += lignes.length * 4.5;
      }
    }
    y += 4;
  }

  if (params.commentaireGeneral) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    y += 4;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Commentaires généraux", 14, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(60);
    const lignes = doc.splitTextToSize(params.commentaireGeneral, 180);
    doc.text(lignes, 14, y);
    y += lignes.length * 5 + 4;
  }

  if (params.observationsSalarie) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Observations du salarié", 14, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(60);
    const lignes = doc.splitTextToSize(params.observationsSalarie, 180);
    doc.text(lignes, 14, y);
    y += lignes.length * 5 + 4;
  }

  // Photos (best effort — on essaie de les intégrer, on ignore si ça échoue)
  if (params.photosUrls.length > 0) {
    for (const url of params.photosUrls) {
      try {
        const dataUrl = await urlVersDataUrl(url);
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(dataUrl, "JPEG", 14, y, 80, 60);
        y += 65;
      } catch {
        // photo ignorée si le chargement échoue
      }
    }
  }

  // Signature
  if (params.signatureDataUrl) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y += 6;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Signature", 14, y);
    y += 4;
    doc.addImage(params.signatureDataUrl, "PNG", 14, y, 70, 25);
  }

  return doc.output("blob");
}

async function urlVersDataUrl(url: string): Promise<string> {
  const reponse = await fetch(url);
  const blob = await reponse.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

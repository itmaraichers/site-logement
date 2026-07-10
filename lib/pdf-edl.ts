import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Element = { nom: string; etat: string; commentaire: string };
type Piece = { nom: string; elements: Element[] };

const COULEUR_PRIMAIRE: [number, number, number] = [14, 165, 233]; // sky-500
const COULEUR_TEXTE: [number, number, number] = [15, 23, 42]; // slate-900
const COULEUR_GRIS: [number, number, number] = [100, 116, 139]; // slate-500

const COULEURS_ETAT: Record<string, [number, number, number]> = {
  Bon: [220, 252, 231], // green-100
  Moyen: [254, 243, 199], // amber-100
  Mauvais: [254, 226, 226], // red-100
  "N/A": [241, 245, 249], // slate-100
};
const COULEURS_ETAT_TEXTE: Record<string, [number, number, number]> = {
  Bon: [21, 128, 61],
  Moyen: [180, 83, 9],
  Mauvais: [185, 28, 28],
  "N/A": [100, 116, 139],
};

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
  signatureEntrepriseDataUrl: string | null;
  signatureSalarieDataUrl: string | null;
  photosUrls: string[];
}): Promise<Blob> {
  const doc = new jsPDF();
  const largeurPage = doc.internal.pageSize.getWidth();
  const margeGauche = 14;
  const margeDroite = 14;
  const largeurUtile = largeurPage - margeGauche - margeDroite;

  // ---------- En-tête coloré ----------
  doc.setFillColor(...COULEUR_PRIMAIRE);
  doc.rect(0, 0, largeurPage, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("État des lieux", margeGauche, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${params.typeEDL === "maison" ? "Maison" : "Chambre"} — ${
      params.sens === "entree" ? "Entrée" : "Sortie"
    } — ${new Date(params.dateEdl).toLocaleDateString("fr-FR")}`,
    margeGauche,
    22
  );

  let y = 38;

  // ---------- Tableau d'informations générales ----------
  const lignesInfos: [string, string][] = [
    ["Maison", params.maisonNom],
  ];
  if (params.chambreNom) lignesInfos.push(["Chambre", params.chambreNom]);
  if (params.salarieNom) lignesInfos.push(["Salarié", params.salarieNom]);
  lignesInfos.push([
    "Date",
    new Date(params.dateEdl).toLocaleDateString("fr-FR"),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margeGauche, right: margeDroite },
    body: lignesInfos,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: COULEUR_TEXTE, cellWidth: 35 },
      1: { textColor: COULEUR_GRIS },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ---------- Pièce par pièce ----------
  for (const piece of params.pieces) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margeGauche, y, largeurUtile, 8, "F");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(piece.nom || "Pièce", margeGauche + 2, y + 5.5);
    y += 8;

    const corps = piece.elements.map((el) => [
      el.nom || "—",
      el.etat,
      el.commentaire || "",
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margeGauche, right: margeDroite },
      head: [["Élément", "État", "Commentaire"]],
      body: corps,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: "auto" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const etat = data.cell.raw as string;
          const bg = COULEURS_ETAT[etat] ?? COULEURS_ETAT["N/A"];
          const txt = COULEURS_ETAT_TEXTE[etat] ?? COULEURS_ETAT_TEXTE["N/A"];
          data.cell.styles.fillColor = bg;
          data.cell.styles.textColor = txt;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ---------- Commentaires généraux / observations ----------
  function ajouterBlocTexte(titre: string, contenu: string) {
    if (!contenu) return;
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text(titre, margeGauche, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COULEUR_GRIS);
    const lignes = doc.splitTextToSize(contenu, largeurUtile);
    doc.text(lignes, margeGauche, y);
    y += lignes.length * 4.5 + 6;
  }

  ajouterBlocTexte("Commentaires généraux", params.commentaireGeneral);
  ajouterBlocTexte("Observations du salarié", params.observationsSalarie);

  // ---------- Photos ----------
  if (params.photosUrls.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text("Photos", margeGauche, y);
    y += 6;

    const largeurPhoto = 58;
    const hauteurPhoto = 44;
    const espacement = 4;
    let x = margeGauche;
    let colonnes = 0;

    for (const url of params.photosUrls) {
      try {
        const dataUrl = await urlVersDataUrl(url);
        if (colonnes === 3) {
          colonnes = 0;
          x = margeGauche;
          y += hauteurPhoto + espacement;
        }
        if (y + hauteurPhoto > 285) {
          doc.addPage();
          y = 20;
          x = margeGauche;
          colonnes = 0;
        }
        doc.addImage(dataUrl, "JPEG", x, y, largeurPhoto, hauteurPhoto);
        x += largeurPhoto + espacement;
        colonnes++;
      } catch {
        // photo ignorée si le chargement échoue
      }
    }
    y += hauteurPhoto + 10;
  }

  // ---------- Signatures (toujours affichées, même vides, pour signature papier) ----------
  {
    if (y > 235) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text("Signatures", margeGauche, y);
    y += 4;

    const largeurCase = (largeurUtile - 8) / 2;
    const hauteurCase = 30;
    const xEntreprise = margeGauche;
    const xSalarie = margeGauche + largeurCase + 8;

    // Case Entreprise
    doc.setDrawColor(203, 213, 225);
    doc.rect(xEntreprise, y, largeurCase, hauteurCase);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COULEUR_GRIS);
    doc.text("Signature entreprise", xEntreprise + 2, y + hauteurCase + 4);
    if (params.signatureEntrepriseDataUrl) {
      doc.addImage(
        params.signatureEntrepriseDataUrl,
        "PNG",
        xEntreprise + 2,
        y + 2,
        largeurCase - 4,
        hauteurCase - 4
      );
    }

    // Case Salarié
    doc.rect(xSalarie, y, largeurCase, hauteurCase);
    doc.text("Signature salarié", xSalarie + 2, y + hauteurCase + 4);
    if (params.signatureSalarieDataUrl) {
      doc.addImage(
        params.signatureSalarieDataUrl,
        "PNG",
        xSalarie + 2,
        y + 2,
        largeurCase - 4,
        hauteurCase - 4
      );
    }

    y += hauteurCase + 8;
  }

  // ---------- Pied de page ----------
  const nbPages = doc.getNumberOfPages();
  for (let i = 1; i <= nbPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COULEUR_GRIS);
    doc.text(
      `Page ${i}/${nbPages} — Généré le ${new Date().toLocaleDateString("fr-FR")}`,
      margeGauche,
      doc.internal.pageSize.getHeight() - 8
    );
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

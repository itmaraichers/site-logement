"use client";

import * as XLSX from "xlsx";

type SalarieExport = {
  nom: string;
  prenom: string;
  telephone: string | null;
  date_naissance: string | null;
  date_entree_entreprise: string | null;
  date_debut_contrat: string | null;
  date_fin_contrat: string | null;
  actif: boolean;
  siteNom: string | null;
  logement: {
    date_entree: string;
    date_sortie_prevue: string | null;
    chambre_nom: string | null;
    maison_nom: string | null;
  } | null;
};

function formaterDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString("fr-FR") : "";
}

export default function ExporterSalariesExcel({
  salaries,
}: {
  salaries: SalarieExport[];
}) {
  function exporter() {
    const lignes = salaries.map((s) => ({
      Prénom: s.prenom,
      Nom: s.nom,
      Téléphone: s.telephone ?? "",
      "Date de naissance": formaterDate(s.date_naissance),
      "Site d'affectation": s.siteNom ?? "",
      Statut: s.actif ? "Actif" : "Inactif",
      "Entrée entreprise": formaterDate(s.date_entree_entreprise),
      "Début de contrat": formaterDate(s.date_debut_contrat),
      "Fin de contrat": formaterDate(s.date_fin_contrat),
      Maison: s.logement?.maison_nom ?? "Non logé",
      Chambre: s.logement?.chambre_nom ?? "",
      "Date d'entrée logement": s.logement
        ? formaterDate(s.logement.date_entree)
        : "",
      "Sortie prévue": s.logement
        ? formaterDate(s.logement.date_sortie_prevue)
        : "",
    }));

    const feuille = XLSX.utils.json_to_sheet(lignes);

    // Largeurs de colonnes raisonnables pour la lisibilité
    feuille["!cols"] = [
      { wch: 14 }, // Prénom
      { wch: 14 }, // Nom
      { wch: 14 }, // Téléphone
      { wch: 16 }, // Date de naissance
      { wch: 18 }, // Site
      { wch: 10 }, // Statut
      { wch: 16 }, // Entrée entreprise
      { wch: 16 }, // Début contrat
      { wch: 16 }, // Fin contrat
      { wch: 18 }, // Maison
      { wch: 14 }, // Chambre
      { wch: 18 }, // Date entrée logement
      { wch: 16 }, // Sortie prévue
    ];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Salariés");

    const dateFichier = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(classeur, `salaries_${dateFichier}.xlsx`);
  }

  return (
    <button
      onClick={exporter}
      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-md transition-colors"
    >
      📊 Exporter en Excel
    </button>
  );
}

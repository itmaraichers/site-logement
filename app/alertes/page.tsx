import { createClient } from "@/lib/supabase/server";
import AlertesListe from "@/components/AlertesListe";

export default async function AlertesPage() {
  const supabase = createClient();

  const [
    { data: entretiens },
    { data: logements },
    { data: parametres },
    { data: edlEntrees },
  ] = await Promise.all([
    supabase
      .from("entretiens")
      .select("id, maison_id, type_entretien_libelle, prochaine_date, maisons(nom)")
      .not("prochaine_date", "is", null),
    supabase
      .from("logements")
      .select(
        "id, chambre_id, salarie_id, date_sortie_prevue, salaries(nom, prenom), chambres(nom)"
      )
      .is("date_sortie_reelle", null)
      .not("date_sortie_prevue", "is", null),
    supabase
      .from("parametres_notification")
      .select("seuil_alerte_jours")
      .eq("id", 1)
      .single(),
    supabase
      .from("logements")
      .select("id, chambre_id, salarie_id, chambres(nom), salaries(nom, prenom)")
      .is("date_sortie_reelle", null),
  ]);

  const seuil = parametres?.seuil_alerte_jours ?? 30;
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  const alertesEntretiens = (entretiens ?? [])
    .map((e) => {
      const cible = new Date(e.prochaine_date as string);
      const jours = Math.floor(
        (cible.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (jours > seuil) return null;
      return {
        id: `entretien-${e.id}`,
        titre: `Entretien "${e.type_entretien_libelle}" — ${
          (e.maisons as any)?.nom
        }`,
        description:
          jours < 0
            ? `En retard depuis le ${cible.toLocaleDateString("fr-FR")}`
            : `Prévu le ${cible.toLocaleDateString("fr-FR")}`,
        gravite: jours < 0 ? ("en_retard" as const) : ("a_prevoir" as const),
        href: `/maisons/${e.maison_id}`,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const alertesSorties = (logements ?? [])
    .map((l) => {
      const cible = new Date(l.date_sortie_prevue as string);
      const jours = Math.floor(
        (cible.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (jours > seuil) return null;
      return {
        id: `sortie-${l.id}`,
        titre: `Sortie prévue — ${(l.salaries as any)?.prenom} ${
          (l.salaries as any)?.nom
        }`,
        description: `${(l.chambres as any)?.nom} · ${
          jours < 0
            ? `sortie dépassée depuis le ${cible.toLocaleDateString("fr-FR")}`
            : `prévue le ${cible.toLocaleDateString("fr-FR")}`
        }`,
        gravite: jours < 0 ? ("en_retard" as const) : ("a_prevoir" as const),
        href: `/chambres/${l.chambre_id}`,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // États des lieux d'entrée manquants pour les occupants actuels
  const alertesEdlManquants = (edlEntrees ?? []).map((l) => ({
    id: `edl-${l.id}`,
    salarieId: l.salarie_id,
    chambreId: l.chambre_id,
    nom: `${(l.salaries as any)?.prenom} ${(l.salaries as any)?.nom}`,
    chambreNom: (l.chambres as any)?.nom,
  }));

  const { data: edlExistants } = await supabase
    .from("etats_des_lieux")
    .select("salarie_id, chambre_id")
    .eq("sens", "entree")
    .eq("type_edl", "chambre");

  const alertesEdlManquantsFiltrees = alertesEdlManquants
    .filter(
      (l) =>
        !(edlExistants ?? []).some(
          (e) => e.salarie_id === l.salarieId && e.chambre_id === l.chambreId
        )
    )
    .map((l) => ({
      id: l.id,
      titre: `État des lieux d'entrée manquant — ${l.nom}`,
      description: `${l.chambreNom} · aucun état des lieux d'entrée enregistré`,
      gravite: "a_prevoir" as const,
      href: `/chambres/${l.chambreId}`,
    }));

  const toutesAlertes = [
    ...alertesEntretiens,
    ...alertesSorties,
    ...alertesEdlManquantsFiltrees,
  ].sort((a, b) => (a.gravite === "en_retard" ? -1 : 1));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Alertes</h1>
        <p className="text-slate-500">
          Entretiens, sorties dépassées et états des lieux manquants —
          calculés à J-{seuil}
        </p>
      </div>

      <AlertesListe alertes={toutesAlertes} />
    </div>
  );
}

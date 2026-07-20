"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Resultat = {
  type: "maison" | "salarie" | "chambre";
  id: string;
  titre: string;
  sousTitre: string;
};

export default function RechercheGlobale() {
  const supabase = createClient();
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fermerSiExterieur(e: MouseEvent) {
      if (
        conteneurRef.current &&
        !conteneurRef.current.contains(e.target as Node)
      ) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  useEffect(() => {
    if (terme.trim().length < 2) {
      setResultats([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setChargement(true);

      const [{ data: maisons }, { data: salaries }, { data: chambres }] =
        await Promise.all([
          supabase
            .from("maisons")
            .select("id, nom, adresse")
            .ilike("nom", `%${terme}%`)
            .limit(5),
          supabase
            .from("salaries")
            .select("id, nom, prenom")
            .or(`nom.ilike.%${terme}%,prenom.ilike.%${terme}%`)
            .limit(5),
          supabase
            .from("chambres")
            .select("id, nom, maisons(nom)")
            .ilike("nom", `%${terme}%`)
            .limit(5),
        ]);

      const r: Resultat[] = [
        ...(maisons ?? []).map((m) => ({
          type: "maison" as const,
          id: m.id,
          titre: m.nom,
          sousTitre: m.adresse ?? "Maison",
        })),
        ...(salaries ?? []).map((s) => ({
          type: "salarie" as const,
          id: s.id,
          titre: `${s.prenom} ${s.nom}`,
          sousTitre: "Salarié",
        })),
        ...(chambres ?? []).map((c: any) => ({
          type: "chambre" as const,
          id: c.id,
          titre: c.nom,
          sousTitre: c.maisons?.nom ?? "Chambre",
        })),
      ];

      setResultats(r);
      setChargement(false);
      setOuvert(true);
    }, 250);

    return () => clearTimeout(timeout);
  }, [terme]); // eslint-disable-line react-hooks/exhaustive-deps

  const ICONE: Record<Resultat["type"], string> = {
    maison: "🏠",
    salarie: "👤",
    chambre: "🛏️",
  };
  const HREF: Record<Resultat["type"], (id: string) => string> = {
    maison: (id) => `/maisons/${id}`,
    salarie: (id) => `/salaries/${id}`,
    chambre: (id) => `/chambres/${id}`,
  };

  return (
    <div className="relative" ref={conteneurRef}>
      <input
        type="text"
        placeholder="Rechercher une maison, un salarié, une chambre..."
        value={terme}
        onChange={(e) => setTerme(e.target.value)}
        onFocus={() => resultats.length > 0 && setOuvert(true)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {ouvert && terme.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {chargement ? (
            <p className="px-4 py-3 text-sm text-slate-400">Recherche...</p>
          ) : resultats.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Aucun résultat pour "{terme}"
            </p>
          ) : (
            resultats.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={HREF[r.type](r.id)}
                onClick={() => setOuvert(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="text-lg">{ICONE[r.type]}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {r.titre}
                  </p>
                  <p className="text-xs text-slate-400">{r.sousTitre}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";

type Alerte = {
  id: string;
  titre: string;
  description: string;
  gravite: "en_retard" | "a_prevoir";
  href: string;
};

const GRAVITE_STYLE: Record<string, string> = {
  en_retard: "border-red-200 bg-red-50",
  a_prevoir: "border-amber-200 bg-amber-50",
};

const GRAVITE_BADGE: Record<string, { label: string; classe: string }> = {
  en_retard: { label: "En retard", classe: "bg-red-100 text-red-700" },
  a_prevoir: { label: "À prévoir", classe: "bg-amber-100 text-amber-700" },
};

export default function AlertesListe({ alertes }: { alertes: Alerte[] }) {
  if (alertes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-2">✅</p>
        <p className="text-slate-500">Aucune alerte active pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alertes.map((a) => {
        const badge = GRAVITE_BADGE[a.gravite];
        return (
          <Link
            key={a.id}
            href={a.href}
            className={`flex items-center justify-between border rounded-lg p-4 hover:shadow-sm transition-all ${GRAVITE_STYLE[a.gravite]}`}
          >
            <div>
              <p className="font-medium text-slate-900">{a.titre}</p>
              <p className="text-sm text-slate-500">{a.description}</p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge.classe}`}
            >
              {badge.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import RechercheGlobale from "@/components/RechercheGlobale";

const ACCES_RAPIDES = [
  { href: "/maisons", label: "Maisons", icone: "🏠" },
  { href: "/salaries", label: "Salariés", icone: "👤" },
  { href: "/chambres", label: "Chambres", icone: "🛏️" },
  { href: "/etats-des-lieux", label: "États des lieux", icone: "📋" },
  { href: "/entretiens", label: "Entretiens", icone: "🔧" },
  { href: "/documents", label: "Documents", icone: "📁" },
  { href: "/alertes", label: "Alertes", icone: "🔔" },
  { href: "/admin", label: "Panel admin", icone: "⚙️" },
];

export default function AccueilPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Accueil</h1>

      <div className="mb-8">
        <RechercheGlobale />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {ACCES_RAPIDES.map((acces) => (
          <Link
            key={acces.href}
            href={acces.href}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary-400 hover:shadow-sm transition-all"
          >
            <span className="text-3xl">{acces.icone}</span>
            <span className="text-sm font-medium text-slate-700">
              {acces.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

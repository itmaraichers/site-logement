"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/maisons", label: "Maisons" },
  { href: "/salaries", label: "Salariés" },
  { href: "/chambres", label: "Chambres" },
  { href: "/etats-des-lieux", label: "États des lieux" },
  { href: "/entretiens", label: "Entretiens" },
  { href: "/documents", label: "Documents" },
  { href: "/alertes", label: "Alertes" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar({
  nombreAlertes = 0,
}: {
  nombreAlertes?: number;
}) {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center gap-1 flex-wrap">
        <span className="font-semibold text-primary-700 mr-4">
          🏠 Logements Salariés
        </span>
        {LIENS.map((lien) => {
          const actif =
            lien.href === "/"
              ? pathname === "/"
              : pathname.startsWith(lien.href);
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                actif
                  ? "bg-primary-500 text-white"
                  : "text-slate-600 hover:bg-primary-50 hover:text-primary-700"
              }`}
            >
              {lien.label}
              {lien.href === "/alertes" && nombreAlertes > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {nombreAlertes > 99 ? "99+" : nombreAlertes}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

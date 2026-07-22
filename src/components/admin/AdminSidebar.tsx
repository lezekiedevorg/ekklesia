'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      name: "Vue d'ensemble",
      href: "/admin",
      icon: "dashboard",
      description: "Indicateurs & santé",
      badge: "Actif",
      badgeBg: "#E8912F",
    },
    {
      name: "Comptes & Utilisateurs",
      href: "/admin/users",
      icon: "groups",
      description: "Gestion & annuaire",
      badge: null,
    },
    {
      name: "Rôles & Permissions",
      href: "/admin/roles",
      icon: "diversity_3",
      description: "Matrice RBAC",
      badge: "Sécurisé",
      badgeBg: "#2E9E6B",
    },
    {
      name: "Règles & Paramètres",
      href: "/admin/settings",
      icon: "tune",
      description: "Config JSONB globale",
      badge: null,
    },
    {
      name: "Journaux d'Audit",
      href: "/admin/logs",
      icon: "history",
      description: "Traçabilité & alertes",
      badge: "Live",
      badgeBg: "#4A47B8",
    },
  ];

  return (
    <aside
      className={`bg-gradient-to-b from-[#252158] to-[#1A183F] text-white flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(26,24,63,0.12)] z-50 min-h-screen transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Header Branding */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E8912F] to-[#F0A650] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#E8912F]/30 shrink-0">
              <span className="material-symbols-outlined text-2xl">church</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                  Ekklesia
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md bg-[#4A47B8] text-indigo-100 border border-indigo-400/30">
                    ADMIN
                  </span>
                </h1>
                <p className="text-xs text-[#9D9AD0] font-medium leading-tight">Centre de Commande</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 items-center justify-center text-[#9D9AD0] hover:text-white transition-colors shrink-0"
            title={collapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            <span className="material-symbols-outlined text-sm font-bold">
              {collapsed ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {!collapsed && (
            <div className="text-xs font-black uppercase tracking-wider text-[#9D9AD0]/60 px-3 py-2">
              ADMINISTRATION CENTRALE
            </div>
          )}
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-white/12 text-white font-bold shadow-sm"
                    : "text-[#9D9AD0] hover:text-white hover:bg-white/6 font-semibold"
                }`}
                title={collapsed ? item.name : undefined}
              >
                <span
                  className={`material-symbols-outlined text-xl transition-transform group-hover:scale-110 shrink-0 ${
                    isActive ? "text-[#E8912F]" : "text-[#9D9AD0] group-hover:text-white"
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="text-sm tracking-tight truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className="text-xs font-extrabold px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ background: item.badgeBg }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Return to Main App & Quick User Pill */}
      <div className="p-4 border-t border-white/10 bg-[#1A183F]/60 space-y-3">
        {!collapsed && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2E9E6B] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
              👑
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate">Mode Backoffice</div>
              <div className="text-xs text-[#9D9AD0] font-medium truncate">Zéro inscription libre</div>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/16 text-white text-xs font-bold transition-all border border-white/10 shadow-xs"
          title="Retour au Tableau de Bord Pastoral"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {!collapsed && <span>Retour Pastorale</span>}
        </Link>
      </div>
    </aside>
  );
}

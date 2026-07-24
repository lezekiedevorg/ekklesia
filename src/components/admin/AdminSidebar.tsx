'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    {
      name: "Centre de Commandement",
      href: "/admin/super-dashboard",
      icon: "rocket_launch",
      description: "Vue globale de l'église",
      badge: "Super",
      badgeBg: "#1e1b4b",
    },
    {
      name: "Fidèles",
      href: "/admin/members",
      icon: "contacts",
      description: "Annuaire & affectations",
      badge: null,
    },
    {
      name: "Cellules (Groupes)",
      href: "/admin/groups",
      icon: "hub",
      description: "Groupes & responsables",
      badge: null,
    },
    {
      name: "Départements",
      href: "/admin/departments",
      icon: "diversity_4",
      description: "Gestion des ministères",
      badge: null,
    },
    {
      name: "Nouveaux",
      href: "/admin/newcomers",
      icon: "person_add",
      description: "Inscriptions dimanche",
      badge: null,
    },
    {
      name: "Programmes",
      href: "/admin/programs",
      icon: "calendar_month",
      description: "Cultes & services configurables",
      badge: null,
    },
    {
      name: "Pointages",
      href: "/admin/attendance",
      icon: "fact_check",
      description: "Présences par programme",
      badge: null,
    },
    {
      name: "Rapports",
      href: "/admin/reports",
      icon: "description",
      description: "Rapports hebdomadaires",
      badge: null,
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
      icon: "admin_panel_settings",
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
      badgeBg: "#4338ca",
    },
  ];

  return (
    <>
      {/* Mobile hamburger (opens drawer) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-3 z-[60] w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#312e81] text-[#fea619] flex items-center justify-center shadow-lg border border-[#fea619]/40"
        title="Ouvrir le menu"
        aria-label="Ouvrir le menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-white text-[#1e1b4b] flex flex-col justify-between shrink-0 border-r border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(30,27,75,0.04)] fixed md:sticky top-0 left-0 h-screen overflow-y-auto z-50 transition-transform md:transition-all duration-300 w-64 ${
          collapsed ? "md:w-20" : "md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
      <div>
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] flex items-center justify-center shadow-lg shadow-indigo-950/25 shrink-0 border border-[#fea619]/40">
              <span className="material-symbols-outlined text-[#fea619] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-[#1e1b4b] flex items-center gap-2">
                  Ekklesia
                  <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-[#fea619]/40">
                    ADMIN
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-tight">Centre de Commande</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-500 hover:text-[#1e1b4b] transition-colors shrink-0"
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
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2">
              Administration Centrale
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
                    ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white font-bold shadow-md shadow-indigo-950/20 border border-[#fea619]/30"
                    : "text-slate-600 hover:text-[#1e1b4b] hover:bg-slate-100 font-semibold"
                }`}
                title={collapsed ? item.name : undefined}
              >
                <span
                  className={`material-symbols-outlined text-xl transition-transform group-hover:scale-110 shrink-0 ${
                    isActive ? "text-[#fea619]" : "text-slate-400 group-hover:text-[#1e1b4b]"
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-wide ${
                          isActive ? "text-white ring-1 ring-white/30" : "text-white"
                        }`}
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
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 space-y-3">
        {!collapsed && (
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#2E9E6B] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
              👑
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1e1b4b] truncate">Mode Backoffice</div>
              <div className="text-xs text-slate-500 font-medium truncate">Zéro inscription libre</div>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-[#312e81] hover:from-[#312e81] hover:to-[#4338ca] text-[#fea619] text-xs font-bold transition-all border border-[#fea619]/40 shadow-lg shadow-indigo-950/20"
          title="Retour au Tableau de Bord Pastoral"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {!collapsed && <span>Retour Pastorale</span>}
        </Link>
      </div>
      </aside>
    </>
  );
}

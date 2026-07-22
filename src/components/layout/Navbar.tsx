"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  role?: "super_admin" | "admin" | "pastor" | "leader" | "shepherd" | string;
  groupName?: string | null;
  userName?: string;
}

export default function Navbar({ role = "shepherd", groupName, userName }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Fidèles", href: "/members", icon: "group" },
    { name: "Présences", href: "/attendance", icon: "event_available" },
    { name: "Discipline", href: "/activities", icon: "auto_awesome" },
    { name: "Alertes", href: "/alerts", icon: "notifications_active" },
    { name: "Rapports", href: "/reports", icon: "assessment" },
  ];

  const roleLabel =
    role === "super_admin"
      ? "Super Administrateur"
      : role === "admin"
      ? "Administrateur"
      : role === "pastor"
      ? "Supervision Générale (Pasteur)"
      : role === "leader"
      ? "Supervision Leader"
      : "Suivi Pastoral (Berger)";

  const roleColorBadge =
    role === "pastor"
      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/40 shadow-sm shadow-amber-500/20"
      : role === "leader"
      ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-indigo-100 border-indigo-700/40 shadow-sm shadow-indigo-950/20"
      : "bg-gradient-to-r from-emerald-700 to-teal-700 text-white border-emerald-600/40 shadow-sm shadow-emerald-700/20";

  return (
    <>
      {/* Desktop & Tablet Top Navbar - Luxe Sanctuary */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(30,27,75,0.04)] px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] flex items-center justify-center text-white font-headline-md font-extrabold text-xl shadow-lg shadow-indigo-950/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 border border-[#fea619]/40">
                <span className="material-symbols-outlined text-[#fea619] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  church
                </span>
              </div>
              <div>
                <div className="font-headline-md font-extrabold text-lg text-[#1e1b4b] flex items-center gap-2.5 tracking-tight">
                  Sanctuaire
                  {groupName && role !== "pastor" && role !== "super_admin" && role !== "admin" && (
                    <span className="text-xs font-label-caps font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300/60 shadow-2xs">
                      Groupe {groupName}
                    </span>
                  )}
                </div>
                <div className="text-xs font-label-caps font-semibold text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  {roleLabel}
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Pills */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-xl text-xs font-label-caps font-bold flex items-center gap-2 transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20 scale-[1.02] border border-[#fea619]/30"
                        : "text-slate-600 hover:text-[#1e1b4b] hover:bg-white/80"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isActive ? "scale-110 text-[#fea619]" : "text-slate-400 group-hover:text-slate-600"}`}
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {(role === "super_admin" || role === "admin") && (
              <>
                <span className="h-6 w-px bg-slate-200" />
                <Link
                  href="/admin"
                  title="Accéder au Backoffice Administration"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-[#fea619] text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-[#1e1b4b]/30 border border-[#fea619]/50 hover:ring-1 hover:ring-[#fea619]/20 hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  <span className="hidden sm:inline">Backoffice</span>
                </Link>
                <span className="h-6 w-px bg-slate-200" />
              </>
            )}

            <Link
              href="/alerts"
              title="Notifications & Alertes"
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#fea619] hover:border-[#fea619]/50 hover:bg-amber-50/30 transition-all relative shadow-2xs group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                notifications
              </span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-100 animate-pulse" />
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 text-slate-800 hover:text-[#1e1b4b] text-xs font-bold transition-all duration-300 shadow-2xs group hover:shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] flex items-center justify-center text-[13px] font-black text-white shadow-sm group-hover:scale-105 transition-transform border border-[#fea619]/40">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="max-w-[130px] truncate font-label-caps font-bold text-xs text-slate-900 group-hover:text-indigo-950 transition-colors">
                  {userName || "Mon Profil"}
                </span>
                <span className="text-xs text-slate-500 font-semibold capitalize flex items-center gap-1">
                  {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role === "pastor" ? "Pasteur" : role === "leader" ? "Leader" : "Berger"}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating Island Nav - Luxe iOS Sanctuary Style */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_12px_40px_rgba(30,27,75,0.15)] px-2.5 py-2 max-w-lg mx-auto">
        <div className={`grid ${(role === "super_admin" || role === "admin") ? "grid-cols-7" : "grid-cols-6"} gap-1`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "text-[#1e1b4b] font-extrabold scale-105"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                    isActive
                      ? "bg-gradient-to-tr from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20 border border-[#fea619]/30"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${isActive ? "text-[#fea619]" : ""}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className={`text-xs font-label-caps mt-1 truncate w-full text-center ${isActive ? "font-bold text-[#1e1b4b]" : "font-semibold text-slate-500"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          {(role === "super_admin" || role === "admin") && (
            <Link
              href="/admin"
              className="flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-300 text-slate-500 hover:text-slate-900 border-l border-slate-200/80 ml-1"
            >
              <div className="p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center hover:bg-slate-100 text-[#fea619]">
                <span className="material-symbols-outlined text-[20px]">
                  admin_panel_settings
                </span>
              </div>
              <span className="text-xs font-label-caps mt-1 truncate w-full text-center font-semibold text-slate-500">
                Admin
              </span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

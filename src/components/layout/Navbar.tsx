"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  role?: "super_admin" | "admin" | "pastor" | "leader" | "shepherd" | string;
  groupName?: string | null;
  userName?: string;
}

interface BottomNavItem {
  name: string;
  short?: string;
  testId: string;
  href: string;
  icon: string;
}

function DesktopOverflowMenu({
  items,
  pathname,
}: {
  items: BottomNavItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = items.some(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Plus d'options"
        aria-expanded={open}
        className={`px-3.5 py-2 rounded-xl text-xs font-label-caps font-bold flex items-center gap-2 transition-all duration-300 ${
          isActive || open
            ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20 scale-[1.02] border border-[#fea619]/30"
            : "text-slate-600 hover:text-[#1e1b4b] hover:bg-white/80"
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: open ? "'FILL' 1" : "'FILL' 0" }}
        >
          more_horiz
        </span>
        Plus
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[200px] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50"
        >
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.testId}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  active
                    ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${active ? "text-[#fea619]" : "text-slate-400"}`}
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className={`text-xs font-bold ${active ? "text-white" : "text-slate-700"}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileBottomNav({
  pathname,
  visibleNavItems,
  overflowNavItems,
  showAdmin,
}: {
  pathname: string;
  visibleNavItems: BottomNavItem[];
  overflowNavItems: BottomNavItem[];
  showAdmin: boolean;
}) {
  const [plusOpen, setPlusOpen] = useState(false);

  useEffect(() => {
    setPlusOpen(false);
  }, [pathname]);

  const isOverflowActive = overflowNavItems.some(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)),
  );

  const totalCols = visibleNavItems.length + (overflowNavItems.length > 0 ? 1 : 0) + (showAdmin ? 1 : 0);
  const gridColsClass =
    totalCols <= 4
      ? "grid-cols-4"
      : totalCols === 5
      ? "grid-cols-5"
      : totalCols === 6
      ? "grid-cols-6"
      : "grid-cols-7";

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_12px_40px_rgba(30,27,75,0.15)] px-2.5 py-2 max-w-lg mx-auto"
      >
        <div className={`grid ${gridColsClass} gap-1`}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.testId}`}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-300 min-h-[44px] ${
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
                <span
                  className={`text-[10px] font-label-caps mt-1 truncate w-full text-center leading-none ${isActive ? "font-bold text-[#1e1b4b]" : "font-semibold text-slate-500"}`}
                >
                  {item.short || item.name}
                </span>
              </Link>
            );
          })}

          {overflowNavItems.length > 0 && (
            <button
              type="button"
              onClick={() => setPlusOpen((v) => !v)}
              data-testid="nav-plus"
              aria-label="Plus d'options"
              aria-expanded={plusOpen}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-300 min-h-[44px] ${
                isOverflowActive || plusOpen
                  ? "text-[#1e1b4b] font-extrabold scale-105"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isOverflowActive || plusOpen
                    ? "bg-gradient-to-tr from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20 border border-[#fea619]/30"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: plusOpen ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {plusOpen ? "close" : "more_horiz"}
                </span>
              </div>
              <span
                className={`text-[10px] font-label-caps mt-1 truncate w-full text-center leading-none ${isOverflowActive || plusOpen ? "font-bold text-[#1e1b4b]" : "font-semibold text-slate-500"}`}
              >
                Plus
              </span>
            </button>
          )}

          {showAdmin && (
            <Link
              href="/admin"
              data-testid="nav-backoffice"
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-300 min-h-[44px] ${
                pathname.startsWith("/admin")
                  ? "text-[#1e1b4b] font-extrabold scale-105"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  pathname.startsWith("/admin")
                    ? "bg-gradient-to-tr from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20 border border-[#fea619]/30"
                    : "hover:bg-slate-100 text-[#fea619]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  admin_panel_settings
                </span>
              </div>
              <span
                className={`text-[10px] font-label-caps mt-1 truncate w-full text-center leading-none ${pathname.startsWith("/admin") ? "font-bold text-[#1e1b4b]" : "font-semibold text-slate-500"}`}
              >
                Admin
              </span>
            </Link>
          )}
        </div>
      </nav>

      {plusOpen && overflowNavItems.length > 0 && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setPlusOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            className="lg:hidden fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-[0_12px_40px_rgba(30,27,75,0.18)] p-2 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="px-3 py-2 text-[10px] font-label-caps uppercase tracking-widest text-slate-400 font-bold">
              Plus
            </div>
            <div className="grid grid-cols-2 gap-1">
              {overflowNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`nav-${item.testId}`}
                    role="menuitem"
                    onClick={() => setPlusOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors min-h-[44px] ${
                      isActive
                        ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${isActive ? "text-[#fea619]" : "text-slate-400"}`}
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-700"}`}>
                      {item.short || item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function Navbar({ role = "shepherd", groupName, userName }: NavbarProps) {
  const pathname = usePathname();

  // Le backoffice et le login ont leur propre chrome
  if (pathname === "/login" || pathname.startsWith("/admin")) return null;

  const allNavItems = [
    { name: "Dashboard", short: "Accueil", testId: "dashboard", href: "/", icon: "dashboard" },
    { name: "Fidèles", short: "Fidèles", testId: "members", href: "/members", icon: "group" },
    { name: "Présences", short: "Prés.", testId: "attendance", href: "/attendance", icon: "event_available", leaderOnly: false },
    { name: "Discipline", short: "Discip.", testId: "activities", href: "/activities", icon: "auto_awesome", leaderOnly: false },
    { name: "Alertes", short: "Alertes", testId: "alerts", href: "/alerts", icon: "notifications_active" },
    { name: "Messages", short: "Messages", testId: "messages", href: "/messages", icon: "chat", leaderOnly: false, superAdminOnly: true },
    { name: "Conversations", short: "Conv.", testId: "conversations", href: "/conversations", icon: "smart_toy", leaderOnly: false, superAdminOnly: true },
    { name: "WhatsApp", short: "WhatsApp", testId: "whatsapp", href: "/whatsapp", icon: "phone_in_talk", leaderOnly: false, superAdminOnly: true },
    { name: "Rapports", short: "Rapports", testId: "reports", href: "/reports", icon: "assessment" },
  ];

  // Filtrage par rôle : leader voit moins, superAdminOnly réservé aux super_admin
  const navItems = allNavItems.filter((item) => {
    if (role === "leader" && item.leaderOnly === false) return false;
    if (item.superAdminOnly && role !== "super_admin") return false;
    return true;
  });

  // Œuvres prioritaires en bas de la nav (max 5 colonnes sur mobile @375px).
  // Tout le reste bascule dans le menu "Plus" pour éviter la troncature.
  const PRIORITY_ORDER = ["dashboard", "members", "attendance", "activities", "alerts", "reports"];
  const sortedItems = [...navItems].sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.testId);
    const bi = PRIORITY_ORDER.indexOf(b.testId);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const VISIBLE_COUNT = 5;
  const visibleNavItems = sortedItems.slice(0, VISIBLE_COUNT);
  const overflowNavItems = sortedItems.slice(VISIBLE_COUNT);

  const roleLabel =
    role === "super_admin"
      ? "Super Administrateur"
      : role === "admin"
      ? "Administrateur"
      : role === "pastor"
      ? "Supervision Générale (Pasteur)"
      : role === "leader"
      ? "Supervision Leader"
      : role === "newcomer_friend"
      ? "Ministère d'Accueil (Ami des Nouveaux)"
      : "Suivi Pastoral (Berger)";

  const roleColorBadge =
    role === "pastor"
      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/40 shadow-sm shadow-amber-500/20"
      : role === "leader"
      ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-indigo-100 border-indigo-700/40 shadow-sm shadow-indigo-950/20"
      : role === "newcomer_friend"
      ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400/40 shadow-sm shadow-sky-600/20"
      : "bg-gradient-to-r from-emerald-700 to-teal-700 text-white border-emerald-600/40 shadow-sm shadow-emerald-700/20";

  return (
    <>
      {/* Desktop & Tablet Top Navbar - Luxe Sanctuary */}
      <header data-testid="navbar-header" className="hidden md:block sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(30,27,75,0.04)] px-4 md:px-8 py-3.5 transition-all">
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
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`nav-${item.testId}`}
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
              {overflowNavItems.length > 0 && (
                <DesktopOverflowMenu items={overflowNavItems} pathname={pathname} />
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3 sm:gap-4">
            {(role === "super_admin" || role === "admin") && (
              <>
                <span className="h-6 w-px bg-slate-200" />
                <Link
                  href="/admin"
                  title="Accéder au Backoffice Administration"
                  data-testid="nav-backoffice"
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
              data-testid="nav-alerts-bell"
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#fea619] hover:border-[#fea619]/50 hover:bg-amber-50/30 transition-all relative shadow-2xs group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                notifications
              </span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-100 animate-pulse" />
            </Link>

            <Link
              href="/profile"
              data-testid="nav-profile"
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
                  {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role === "pastor" ? "Pasteur" : role === "leader" ? "Leader" : role === "newcomer_friend" ? "Ami des Nouveaux" : "Berger"}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating Island Nav - Luxe iOS Sanctuary Style */}
      <MobileBottomNav
        pathname={pathname}
        visibleNavItems={visibleNavItems}
        overflowNavItems={overflowNavItems}
        showAdmin={role === "super_admin" || role === "admin"}
      />
    </>
  );
}

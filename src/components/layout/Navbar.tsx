"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  role?: "pastor" | "leader" | "shepherd";
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

  return (
    <>
      {/* Top Navbar - Sanctuaire Design System */}
      <header className="border-b border-[#c8c5d0]/30 bg-[#f7f9fb]/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#1e1b4b] flex items-center justify-center text-white font-headline-md font-bold text-lg shadow-md shadow-[#1e1b4b]/20 group-hover:scale-105 transition-all duration-300 border border-[#fea619]/40">
                <span className="material-symbols-outlined text-[#fea619] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
              </div>
              <div>
                <div className="font-headline-md font-bold text-lg text-[#1e1b4b] flex items-center gap-2.5 tracking-tight">
                  Sanctuaire
                  {groupName && role !== "pastor" && (
                    <span className="text-[10px] font-label-caps font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fea619]/15 text-[#855300] border border-[#fea619]/30 shadow-2xs">
                      Groupe {groupName}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-label-caps font-medium text-[#47464f]">
                  {role === "pastor" ? "Supervision Générale (Pasteur)" : role === "leader" ? "Supervision Leader" : "Suivi Pastoral (Berger)"}
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-[#c8c5d0]/30 shadow-2xs">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-xl text-xs font-label-caps font-bold flex items-center gap-2 transition-all duration-200 ${
                      isActive
                        ? "bg-[#1e1b4b] text-white shadow-sm shadow-[#1e1b4b]/20 scale-[1.02]"
                        : "text-[#47464f] hover:text-[#1e1b4b] hover:bg-[#f2f4f6]"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
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

          <div className="flex items-center gap-4">
            <button
              title="Notifications & Alertes"
              className="w-10 h-10 rounded-xl bg-white border border-[#c8c5d0]/30 flex items-center justify-center text-[#47464f] hover:text-[#fea619] hover:border-[#fea619]/40 transition-colors relative shadow-2xs"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#fea619]"></span>
            </button>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-[#c8c5d0]/30 hover:border-[#1e1b4b]/40 text-[#191c1e] hover:text-[#1e1b4b] text-xs font-bold transition-all duration-200 shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1e1b4b] to-[#47464f] flex items-center justify-center text-[12px] font-black text-white shadow-2xs group-hover:scale-105 transition-transform border border-[#fea619]/40">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="max-w-[120px] truncate font-label-caps font-bold text-xs">{userName || "Mon Profil"}</span>
                <span className="text-[10px] text-[#47464f] font-medium capitalize">{role}</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Sanctuaire Design System */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#c8c5d0]/40 px-2 py-2 shadow-lg">
        <div className="grid grid-cols-6 gap-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-[#1e1b4b] font-bold scale-105"
                    : "text-[#47464f] hover:text-[#191c1e]"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-[#1e1b4b]/10 text-[#1e1b4b]" : ""}`}>
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className="text-[10px] font-label-caps mt-0.5 truncate w-full text-center font-bold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminTopbarProps {
  userContext: {
    profile: {
      first_name: string | null;
      last_name: string | null;
      email: string;
      role: string;
    };
    roles: string[];
  };
}

export default function AdminTopbar({ userContext }: AdminTopbarProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState('admin');
  const pathname = usePathname();

  const fullName =
    `${userContext.profile.first_name || 'Admin'} ${userContext.profile.last_name || ''}`.trim() ||
    userContext.profile.email.split('@')[0];

  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'AD';

  const spaces = [
    {
      id: 'super_admin',
      name: 'Super Administrateur',
      short: 'Contrôle Total & Sécurité',
      icon: 'admin_panel_settings',
      badgeBg: '#4A47B8',
      badgeColor: '#fff',
      desc: 'Accès complet au Backoffice, configuration JSONB et gestion des rôles.',
    },
    {
      id: 'admin',
      name: 'Administration Centrale',
      short: 'Secrétariat & Annuaire',
      icon: 'shield',
      badgeBg: '#3B379A',
      badgeColor: '#fff',
      desc: 'Gestion des comptes, des membres et traçabilité d’audit.',
    },
    {
      id: 'pasteur',
      name: 'Pasteur Principal',
      short: 'Vue Pastorale & Soin',
      icon: 'church',
      badgeBg: '#2E9E6B',
      badgeColor: '#fff',
      desc: 'Supervision spirituelle, prédications et vitalité des cellules.',
    },
    {
      id: 'berger',
      name: 'Berger de Cellule',
      short: 'Suivi & Pointage',
      icon: 'diversity_3',
      badgeBg: '#E8912F',
      badgeColor: '#fff',
      desc: 'Pointage hebdomadaire, prières et affermissement des âmes.',
    },
    {
      id: 'responsable',
      name: 'Responsable Ministère',
      short: 'Planning & Équipe',
      icon: 'tune',
      badgeBg: '#C0722E',
      badgeColor: '#fff',
      desc: 'Gestion des rotations, répétitions et ressources techniques.',
    },
  ];

  const currentSpace = spaces.find((s) => s.id === activeSpace) || spaces[1];

  return (
    <header className="h-[70px] bg-[#FAF9F6]/85 backdrop-blur-md border-b border-[#EDEBE4] px-6 sticky top-0 z-40 flex items-center justify-between transition-all">
      {/* Left section: Breadcrumbs / Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8B8A96] uppercase tracking-wider">
          <span className="text-[#4A47B8] font-black">SANCTUAIRE</span>
          <span>/</span>
          <span className="text-[#1E1B4B]">
            {pathname === '/admin'
              ? 'VUE D’ENSEMBLE'
              : pathname.includes('/users')
              ? 'COMPTES & UTILISATEURS'
              : pathname.includes('/roles')
              ? 'MATRICE RBAC & PERMISSIONS'
              : pathname.includes('/settings')
              ? 'RÈGLES & PARAMÈTRES'
              : 'JOURNAUX D’AUDIT'}
          </span>
        </div>
      </div>

      {/* Right section: System status, Role/Space Switcher, Profile */}
      <div className="flex items-center gap-4">
        {/* System Health Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F5EE] border border-[#A9E0C4]/60 text-[#2E9E6B] text-xs font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#2E9E6B] animate-pulse"></span>
          <span>Système Sécurisé & Actif</span>
        </div>

        {/* Ekklesia Role Switcher / Espace Actif (RBAC Matrix Simulator) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-[#E4E1DA] hover:border-[#4A47B8] transition-all shadow-2xs text-left"
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs"
              style={{ background: currentSpace.badgeBg }}
            >
              <span className="material-symbols-outlined text-sm font-bold">{currentSpace.icon}</span>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] uppercase font-black tracking-wider text-[#8B8A96]">Espace Actif</div>
              <div className="text-xs font-black text-[#1E1B4B] leading-tight flex items-center gap-1">
                <span>{currentSpace.name}</span>
                <span className="material-symbols-outlined text-sm text-[#8B8A96]">expand_more</span>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl border border-[#EDEBE4] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#EDEBE4]">
                  <div>
                    <div className="text-xs font-black text-[#1E1B4B]">BASCULER D&apos;ESPACE (RBAC)</div>
                    <div className="text-[11px] text-[#8B8A96]">Prévisualisez ou naviguez dans le système</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEEEFA] text-[#4A47B8]">
                    {spaces.length} rôles
                  </span>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {spaces.map((s) => {
                    const active = s.id === activeSpace;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveSpace(s.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                          active
                            ? 'bg-[#F0EFFB] border border-[#4A47B8]/30'
                            : 'hover:bg-[#FAF9F6] border border-transparent'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs"
                          style={{ background: s.badgeBg }}
                        >
                          <span className="material-symbols-outlined text-lg">{s.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#1E1B4B] truncate">{s.name}</span>
                            {active && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#4A47B8] text-white">
                                Actif
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-[#8B8A96]">{s.short}</div>
                          <div className="text-[10px] text-[#6E6D79] mt-1 line-clamp-2 leading-relaxed">
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 mt-3 border-t border-[#EDEBE4]">
                  <Link
                    href="/admin/roles"
                    onClick={() => setRoleMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EDEBE4]/60 text-[#1E1B4B] text-xs font-black transition-all"
                  >
                    <span className="material-symbols-outlined text-sm text-[#4A47B8]">security</span>
                    <span>Gérer la Matrice RBAC Globale</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#EDEBE4]">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4A47B8] to-[#252158] text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#4A47B8]/20">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-black text-[#1E1B4B] leading-tight">{fullName}</div>
            <div className="text-[11px] font-bold text-[#E8912F]">{userContext.roles[0] || 'Super Admin'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

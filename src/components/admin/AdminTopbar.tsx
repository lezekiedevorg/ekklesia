'use client';

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
  const pathname = usePathname();

  const fullName =
    `${userContext.profile.first_name || 'Admin'} ${userContext.profile.last_name || ''}`.trim() ||
    userContext.profile.email.split('@')[0];

  const initials =
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'AD';

  const crumb =
    pathname === '/admin'
      ? 'VUE D’ENSEMBLE'
      : pathname.includes('/super-dashboard')
      ? 'CENTRE DE COMMANDEMENT'
      : pathname.includes('/members')
      ? 'FIDÈLES'
      : pathname.includes('/groups')
      ? 'CELLULES & RESPONSABLES'
      : pathname.includes('/departments')
      ? 'DÉPARTEMENTS'
      : pathname.includes('/newcomers')
      ? 'NOUVEAUX VENUS'
      : pathname.includes('/programs')
      ? 'PROGRAMMES & CULTES'
      : pathname.includes('/attendance')
      ? 'POINTAGES'
      : pathname.includes('/reports')
      ? 'RAPPORTS'
      : pathname.includes('/users')
      ? 'COMPTES & UTILISATEURS'
      : pathname.includes('/roles')
      ? 'MATRICE RBAC & PERMISSIONS'
      : pathname.includes('/settings')
      ? 'RÈGLES & PARAMÈTRES'
      : pathname.includes('/logs')
      ? 'JOURNAUX D’AUDIT'
      : 'ADMINISTRATION';

  return (
    <header data-testid="admin-topbar" className="h-[70px] shrink-0 bg-white/85 backdrop-blur-2xl border-b border-slate-200/80 pl-16 pr-4 md:px-8 z-40 flex items-center justify-between shadow-[0_4px_24px_-4px_rgba(30,27,75,0.04)] overflow-hidden">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-0 w-full overflow-hidden">
        <span className="text-[#1e1b4b] font-black shrink-0">SANCTUAIRE</span>
        <span className="text-slate-300 shrink-0">/</span>
        <span className="text-[#1e1b4b] truncate whitespace-nowrap min-w-0">{crumb}</span>
      </div>

      {/* Right: profile pill */}
      <div className="flex items-center gap-3 pl-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-950/20 border border-[#fea619]/40">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-[#1e1b4b] leading-tight truncate max-w-[160px]">{fullName}</div>
          <div className="text-xs font-semibold text-[#fea619] capitalize">{userContext.roles[0] || 'Super Admin'}</div>
        </div>
      </div>
    </header>
  );
}

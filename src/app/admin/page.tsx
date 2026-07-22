import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getCurrentUserContext } from '@/lib/auth/permissions';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext();

  // Fetch summary counts
  const [profilesRes, rolesRes, settingsRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('id, role', { count: 'exact' }),
    supabase.from('app_roles').select('code, name', { count: 'exact' }),
    supabase.from('app_settings').select('key, category', { count: 'exact' }),
    supabase.from('app_audit_logs').select('*').order('created_at', { ascending: false }).limit(6),
  ]);

  const totalUsers = profilesRes.count || (profilesRes.data || []).length;
  const totalRoles = rolesRes.count || (rolesRes.data || []).length;
  const totalSettings = settingsRes.count || (settingsRes.data || []).length;
  const recentLogs = logsRes.data || [];

  // Count by role
  const roleCounts: Record<string, number> = {};
  (profilesRes.data || []).forEach((p) => {
    const r = p.role || 'inconnu';
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });

  const firstName = context?.profile.first_name || 'Ézéchiel';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Eyebrow Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_24px_rgba(30,27,75,0.03)]">
        <div className="space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-widest text-[#E8912F] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8912F]"></span>
            <span>VUE ADMINISTRATIVE · CENTRE DE COMMANDE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1E1B4B] tracking-tight">
            Bonjour, {firstName} 🕊️
          </h1>
          <p className="text-sm text-[#6E6D79] font-medium max-w-xl leading-relaxed">
            Bienvenue dans l&apos;espace de pilotage Ekklesia. Gérez les rôles, configurez les règles globales en JSONB et suivez l&apos;activité de toute l&apos;église en temps réel.
          </p>
        </div>

        {/* Action Buttons (Ekklesia ctaPrimary & ctaGhost style) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-gradient-to-r from-[#E8912F] to-[#D97B1E] text-white font-bold text-sm shadow-[0_8px_20px_rgba(232,145,47,0.32)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span>Créer un Compte</span>
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2.5 h-12 px-5 rounded-2xl bg-white border border-[#EDEBE4] hover:border-[#4A47B8] text-[#4A47B8] font-bold text-sm hover:bg-[#FAF9F6] transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-xl">tune</span>
            <span>Règles & Paramètres</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (4 columns matching Ekklesia layout & colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Membres / Comptes */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_20px_rgba(30,27,75,0.03)] flex flex-col justify-between hover:border-[#4A47B8]/30 transition-all">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEEFA] text-[#4A47B8] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-bold">groups</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-[#E7F5EE] text-[#2E9E6B]">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>100% Géré</span>
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1E1B4B] tracking-tight">{totalUsers}</div>
            <div className="text-sm font-bold text-[#8B8A96] uppercase tracking-wider mt-1">Comptes Pastoraux</div>
          </div>
        </div>

        {/* KPI 2: Rôles & Permissions */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_20px_rgba(30,27,75,0.03)] flex flex-col justify-between hover:border-[#2E9E6B]/30 transition-all">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E7F5EE] text-[#2E9E6B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-bold">diversity_3</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-[#EEEEFA] text-[#4A47B8]">
              <span>RBAC Granulaire</span>
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1E1B4B] tracking-tight">{totalRoles}</div>
            <div className="text-sm font-bold text-[#8B8A96] uppercase tracking-wider mt-1">Rôles Configurés</div>
          </div>
        </div>

        {/* KPI 3: Règles JSONB */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_20px_rgba(30,27,75,0.03)] flex flex-col justify-between hover:border-[#E8912F]/30 transition-all">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1E0] text-[#E8912F] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-bold">settings</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-[#FFF1E0] text-[#B57A1E]">
              <span>Dynamique</span>
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1E1B4B] tracking-tight">{totalSettings}</div>
            <div className="text-sm font-bold text-[#8B8A96] uppercase tracking-wider mt-1">Paramètres JSONB</div>
          </div>
        </div>

        {/* KPI 4: Sécurité & Audit */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_20px_rgba(30,27,75,0.03)] flex flex-col justify-between hover:border-[#E04A4A]/30 transition-all">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FCEBEB] text-[#E04A4A] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-bold">shield</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-[#E7F5EE] text-[#2E9E6B]">
              <span>Verrouillé</span>
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#2E9E6B] tracking-tight">Actif</div>
            <div className="text-sm font-bold text-[#8B8A96] uppercase tracking-wider mt-1">Audit En Temps Réel</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Role Distribution + Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Panel */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-7 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_24px_rgba(30,27,75,0.03)] space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[#1E1B4B]">Matrice des Responsabilités</h2>
            <p className="text-xs text-[#8B8A96] font-medium">Répartition des comptes par niveau d&apos;accès</p>
          </div>

          <div className="space-y-4">
            {[
              { code: 'super_admin', label: 'Super Administrateurs', color: '#4A47B8', bg: '#EEEEFA' },
              { code: 'admin', label: 'Administrateurs', color: '#3B379A', bg: '#EEEEFA' },
              { code: 'pastor', label: 'Pasteurs Principaux', color: '#2E9E6B', bg: '#E7F5EE' },
              { code: 'leader', label: 'Bergers & Responsables', color: '#E8912F', bg: '#FFF1E0' },
              { code: 'shepherd', label: 'Encadrants / Cellules', color: '#7A62C4', bg: '#F0EBF7' },
            ].map((role) => {
              const count = roleCounts[role.code] || 0;
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={role.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1E1B4B]">{role.label}</span>
                    <span className="font-black px-2 py-0.5 rounded-full text-xs" style={{ background: role.bg, color: role.color }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF9F6] border border-[#EDEBE4] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%`, background: role.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#EDEBE4]">
            <Link
              href="/admin/roles"
              className="flex items-center justify-between text-xs font-extrabold text-[#4A47B8] hover:text-[#252158] transition-colors"
            >
              <span>Consulter la matrice détaillée</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Recent Audit Activities Feed */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-[#EDEBE4] shadow-[0_4px_24px_rgba(30,27,75,0.03)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDEBE4] pb-4">
              <div>
                <h2 className="text-base font-black text-[#1E1B4B]">Flux de Traçabilité & Audit</h2>
                <p className="text-xs text-[#8B8A96] font-medium">Suivi inaltérable des actions administratives</p>
              </div>
              <Link
                href="/admin/logs"
                className="text-xs font-bold text-[#E8912F] hover:text-[#D97B1E] flex items-center gap-1 transition-colors"
              >
                <span>Voir tout ({recentLogs.length})</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="divide-y divide-[#EDEBE4]">
              {recentLogs.length === 0 ? (
                <div className="py-12 text-center text-[#8B8A96] text-sm font-medium space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] mx-auto flex items-center justify-center text-xl text-[#8B8A96]">
                    📋
                  </div>
                  <p>Aucun événement d&apos;audit récent enregistré dans le journal.</p>
                </div>
              ) : (
                recentLogs.map((log) => {
                  const isCreate = log.action.includes('CREATE');
                  const isUpdate = log.action.includes('UPDATE');
                  const isDelete = log.action.includes('DELETE');
                  const iconBg = isCreate ? '#E7F5EE' : isUpdate ? '#FFF1E0' : isDelete ? '#FCEBEB' : '#EEEEFA';
                  const iconCol = isCreate ? '#2E9E6B' : isUpdate ? '#E8912F' : isDelete ? '#E04A4A' : '#4A47B8';
                  const iconName = isCreate ? 'add_circle' : isUpdate ? 'edit' : isDelete ? 'delete' : 'notifications';

                  return (
                    <div key={log.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAF9F6]/60 px-3 rounded-2xl transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ background: iconBg, color: iconCol }}
                        >
                          <span className="material-symbols-outlined text-xl">{iconName}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-[#1E1B4B] truncate">{log.action}</div>
                          <div className="text-xs text-[#8B8A96] font-medium truncate mt-0.5">
                            Ressource: <span className="font-bold text-[#4A47B8]">{log.resource_type || 'Général'}</span> ({log.resource_id || 'N/A'})
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-[#1E1B4B]">
                          {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-[#8B8A96] font-medium">
                          {new Date(log.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

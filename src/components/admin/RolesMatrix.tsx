'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateRolePermissionsAction,
  createRoleAction,
  deleteRoleAction,
} from '@/app/admin/actions/roles';

interface Role {
  code: string;
  name: string;
  description?: string;
  is_system?: boolean;
}

interface Permission {
  code: string;
  name: string;
  category: string;
  description?: string;
}

interface RolePermission {
  role_code: string;
  permission_code: string;
}

export default function RolesMatrix({
  roles,
  permissions,
  initialRolePermissions,
}: {
  roles: Role[];
  permissions: Permission[];
  initialRolePermissions: RolePermission[];
}) {
  // Map of `role_code:permission_code` -> boolean
  const [matrix, setMatrix] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialRolePermissions.forEach((rp) => {
      map[`${rp.role_code}:${rp.permission_code}`] = true;
    });
    return map;
  });

  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ code: '', name: '', description: '' });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await createRoleAction(newRole);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Rôle créé');
      setShowCreate(false);
      setNewRole({ code: '', name: '', description: '' });
      router.refresh();
    }
  };

  const removeRole = async (roleCode: string, roleName: string) => {
    if (!confirm(`Supprimer le rôle "${roleName}" ? Cette action est irréversible.`)) return;
    setError(null);
    setMessage(null);
    const result = await deleteRoleAction(roleCode);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Rôle supprimé');
      router.refresh();
    }
  };

  const togglePermission = (roleCode: string, permCode: string) => {
    if (roleCode === 'super_admin') return; // Super admin always has all
    const key = `${roleCode}:${permCode}`;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveRolePermissions = async (roleCode: string) => {
    setSavingRole(roleCode);
    setMessage(null);
    setError(null);

    const activePermCodes = permissions
      .filter((p) => matrix[`${roleCode}:${p.code}`])
      .map((p) => p.code);

    const result = await updateRolePermissionsAction(roleCode, activePermCodes);
    setSavingRole(null);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Permissions enregistrées');
    }
  };

  // Group permissions by category
  const categories: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    const cat = p.category || 'Général';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });
  const categoryNames = Object.keys(categories);

  // Accordion: collapsed by default so the matrix stays compact
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleCat = (cat: string) =>
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  const expandAll = () => setExpandedCats(new Set(categoryNames));
  const collapseAll = () => setExpandedCats(new Set());

  const grantedInCat = (perms: Permission[], roleCode: string) =>
    roleCode === 'super_admin'
      ? perms.length
      : perms.filter((p) => matrix[`${roleCode}:${p.code}`]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={expandAll} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#1e1b4b] hover:border-[#1e1b4b]/30 text-xs font-bold transition-all">
            <span className="material-symbols-outlined text-[16px]">unfold_more</span>
            Tout déplier
          </button>
          <button onClick={collapseAll} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#1e1b4b] hover:border-[#1e1b4b]/30 text-xs font-bold transition-all">
            <span className="material-symbols-outlined text-[16px]">unfold_less</span>
            Tout replier
          </button>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-[#fea619]">add_circle</span>
          Nouveau rôle
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-[11px] font-black uppercase tracking-wider text-indigo-200">
                <th className="py-4 px-6 min-w-[240px]">Permission / Fonctionnalité</th>
                {roles.map((r) => (
                  <th key={r.code} className="py-4 px-4 text-center min-w-[140px]">
                    <div className="font-black text-white text-xs">{r.name}</div>
                    <div className="text-[10px] font-mono text-indigo-300/80 mt-0.5">{r.code}</div>
                    {r.is_system ? (
                      <div className="text-[9px] font-bold text-indigo-300/60 uppercase mt-0.5">Système</div>
                    ) : (
                      <button
                        onClick={() => removeRole(r.code, r.name)}
                        className="text-[10px] font-bold text-rose-300 hover:text-rose-200 mt-0.5 inline-flex items-center gap-0.5"
                        title="Supprimer ce rôle"
                      >
                        <span className="material-symbols-outlined text-[12px]">delete</span>
                        Supprimer
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {Object.entries(categories).map(([category, perms]) => {
                const open = expandedCats.has(category);
                return (
                <Fragment key={category}>
                  <tr
                    className="bg-indigo-50/70 border-t border-b border-indigo-100 font-black text-xs text-indigo-900 cursor-pointer hover:bg-indigo-100/70 transition-colors"
                    onClick={() => toggleCat(category)}
                  >
                    <td className="py-3 px-6 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] transition-transform ${open ? 'rotate-90' : ''}`}>chevron_right</span>
                        <span>{category}</span>
                        <span className="text-[10px] font-bold text-indigo-400 normal-case">({perms.length})</span>
                      </div>
                    </td>
                    {roles.map((r) => (
                      <td key={`cat-${category}-${r.code}`} className="py-3 px-4 text-center text-[11px] font-bold text-indigo-400">
                        {grantedInCat(perms, r.code)}/{perms.length}
                      </td>
                    ))}
                  </tr>
                  {open && perms.map((p) => (
                    <tr key={p.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{p.code}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{p.description}</div>
                        )}
                      </td>
                      {roles.map((r) => {
                        const isChecked = r.code === 'super_admin' ? true : !!matrix[`${r.code}:${p.code}`];
                        const isDisabled = r.code === 'super_admin';
                        return (
                          <td key={`${r.code}:${p.code}`} className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => togglePermission(r.code, p.code)}
                              className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40 cursor-pointer transition-all"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80 border-t border-slate-200/80">
                <td className="py-4 px-6 font-black text-xs uppercase tracking-wider text-slate-500">
                  Enregistrer les modifications :
                </td>
                {roles.map((r) => (
                  <td key={r.code} className="py-4 px-4 text-center">
                    {r.code !== 'super_admin' ? (
                      <button
                        onClick={() => saveRolePermissions(r.code)}
                        disabled={savingRole === r.code}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all"
                      >
                        {savingRole === r.code ? '...' : 'Sauvegarder'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">Verrouillé (Tout inclus)</span>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-[#fea619] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1b4b]">Nouveau rôle</h2>
            </div>
            <form onSubmit={createRole} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Nom</label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]"
                  placeholder="Ex: Ami des Nouveaux"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Code technique</label>
                <input
                  type="text"
                  required
                  value={newRole.code}
                  onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]"
                  placeholder="ex: newcomer_friend"
                />
                <p className="text-[11px] text-slate-400 mt-1">Minuscules, chiffres et underscores. Immuable après création.</p>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]"
                  placeholder="Rôle du membre..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-md transition-all disabled:opacity-50"
                >
                  {busy ? 'Création...' : 'Créer le rôle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

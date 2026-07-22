'use client';

import { useState } from 'react';
import { updateRolePermissionsAction } from '@/app/admin/actions/roles';

interface Role {
  code: string;
  name: string;
  description?: string;
  level: number;
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

  return (
    <div className="space-y-6">
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
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6 min-w-[240px]">Permission / Fonctionnalité</th>
                {roles.map((r) => (
                  <th key={r.code} className="py-4 px-4 text-center min-w-[140px]">
                    <div className="font-black text-[#1e1b4b] text-xs">{r.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{r.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {Object.entries(categories).map(([category, perms]) => (
                <Fragment key={category}>
                  <tr className="bg-indigo-50/60 border-t border-b border-indigo-100/60 font-black text-xs text-indigo-900">
                    <td colSpan={roles.length + 1} className="py-2.5 px-6 uppercase tracking-wider">
                      📁 {category}
                    </td>
                  </tr>
                  {perms.map((p) => (
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
              ))}
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
    </div>
  );
}

import { Fragment } from 'react';

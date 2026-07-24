import { getUsersAction } from '@/app/admin/actions/users';
import { getRolesMatrixAction } from '@/app/admin/actions/roles';
import { createClient } from '@/lib/supabase/server';
import UsersManager from '@/components/admin/UsersManager';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [result, rolesResult, groupsRes] = await Promise.all([
    getUsersAction(),
    getRolesMatrixAction(),
    supabase.from('groups').select('id, name').order('name'),
  ]);
  const users = result.success ? result.users || [] : [];
  const roles = rolesResult.success ? (rolesResult.roles || []).map((r: any) => ({ code: r.code, name: r.name })) : [];
  const groups = (groupsRes.data || []).map((g: any) => ({ id: g.id, name: g.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Gestion des Comptes & Rôles Utilisateurs
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Seul le personnel administratif peut créer ou désactiver des comptes. Les inscriptions publiques sont désactivées.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <UsersManager initialUsers={users} roles={roles} groups={groups} />
    </div>
  );
}

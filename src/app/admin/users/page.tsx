import { getUsersAction } from '@/app/admin/actions/users';
import UsersManager from '@/components/admin/UsersManager';

export default async function AdminUsersPage() {
  const result = await getUsersAction();
  const users = result.success ? result.users || [] : [];

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

      <UsersManager initialUsers={users} />
    </div>
  );
}

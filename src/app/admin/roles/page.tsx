import { getRolesMatrixAction } from '@/app/admin/actions/roles';
import RolesMatrix from '@/components/admin/RolesMatrix';

export default async function AdminRolesPage() {
  const result = await getRolesMatrixAction();
  const roles = result.success ? result.roles || [] : [];
  const permissions = result.success ? result.permissions || [] : [];
  const rolePermissions = result.success ? result.rolePermissions || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Matrice des Rôles & Permissions (RBAC)
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Cochez ou décochez les fonctionnalités autorisées pour chaque rôle. Tout changement s&apos;applique immédiatement après sauvegarde.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <RolesMatrix
        roles={roles}
        permissions={permissions}
        initialRolePermissions={rolePermissions}
      />
    </div>
  );
}

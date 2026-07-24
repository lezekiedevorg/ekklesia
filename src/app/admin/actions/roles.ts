'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getRolesMatrixAction() {
  try {
    await assertPermission('roles:view');
    const supabase = await createClient();

    const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
      supabase.from('app_roles').select('*').order('code'),
      supabase.from('app_permissions').select('*').order('category, code'),
      supabase.from('app_role_permissions').select('*'),
    ]);

    if (rolesRes.error) return { error: rolesRes.error.message };
    if (permsRes.error) return { error: permsRes.error.message };
    if (rolePermsRes.error) return { error: rolePermsRes.error.message };

    return {
      success: true,
      roles: rolesRes.data || [],
      permissions: permsRes.data || [],
      rolePermissions: rolePermsRes.data || [],
    };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération de la matrice des rôles.' };
  }
}

export async function createRoleAction(data: { code: string; name: string; description?: string }) {
  try {
    await assertPermission('roles:edit');
    const supabase = await createClient();

    const code = data.code?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const name = data.name?.trim();
    if (!code || !name) {
      return { error: 'Le code et le nom du rôle sont obligatoires.' };
    }

    const { error } = await supabase
      .from('app_roles')
      .insert({ code, name, description: data.description?.trim() || null, is_system: false });

    if (error) {
      if (error.code === '23505') return { error: `Le rôle "${code}" existe déjà.` };
      return { error: error.message };
    }

    await logAuditAction({
      action: 'ROLE_CREATED',
      resourceType: 'role',
      resourceId: code,
      newValues: { code, name },
    });

    revalidatePath('/admin/roles');
    return { success: true, message: `Rôle "${name}" créé. Assignez-lui des fonctionnalités.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la création du rôle.' };
  }
}

export async function deleteRoleAction(roleCode: string) {
  try {
    await assertPermission('roles:edit');
    const supabase = await createClient();

    // Only custom (non-system) roles may be deleted
    const { data: role } = await supabase
      .from('app_roles')
      .select('is_system, name')
      .eq('code', roleCode)
      .single();

    if (!role) return { error: 'Rôle introuvable.' };
    if (role.is_system) return { error: 'Les rôles système ne peuvent pas être supprimés.' };

    // app_role_permissions and app_user_roles cascade on delete
    const { error } = await supabase.from('app_roles').delete().eq('code', roleCode);
    if (error) return { error: error.message };

    await logAuditAction({
      action: 'ROLE_DELETED',
      resourceType: 'role',
      resourceId: roleCode,
      oldValues: { code: roleCode, name: role.name },
    });

    revalidatePath('/admin/roles');
    return { success: true, message: `Rôle "${role.name}" supprimé.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la suppression du rôle.' };
  }
}

export async function updateRolePermissionsAction(roleCode: string, permissionCodes: string[]) {
  try {
    await assertPermission('roles:edit');
    const supabase = await createClient();

    // Prevent removing critical permissions from super_admin or admin accidentally
    if (roleCode === 'super_admin') {
      return { error: 'Les permissions du Super Administrateur ne peuvent pas être restreintes.' };
    }

    // Get old permissions for audit log
    const { data: oldPerms } = await supabase
      .from('app_role_permissions')
      .select('permission_code')
      .eq('role_code', roleCode);

    // Delete existing permissions for role
    const { error: delError } = await supabase
      .from('app_role_permissions')
      .delete()
      .eq('role_code', roleCode);

    if (delError) return { error: delError.message };

    // Insert new permissions
    if (permissionCodes.length > 0) {
      const inserts = permissionCodes.map(code => ({
        role_code: roleCode,
        permission_code: code,
      }));
      const { error: insError } = await supabase
        .from('app_role_permissions')
        .insert(inserts);

      if (insError) return { error: insError.message };
    }

    await logAuditAction({
      action: 'ROLE_PERMISSIONS_UPDATED',
      resourceType: 'role',
      resourceId: roleCode,
      oldValues: (oldPerms || []).map(p => p.permission_code),
      newValues: permissionCodes,
    });

    revalidatePath('/admin/roles');
    revalidatePath('/admin');
    return { success: true, message: `Permissions du rôle (${roleCode}) mises à jour.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la modification des permissions.' };
  }
}

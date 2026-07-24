'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function getUsersAction() {
  try {
    await assertPermission('users:view');
    const supabase = await createClient();

    // Fetch profiles + group name. app_user_roles is fetched separately because
    // it FKs to auth.users (not profiles), so PostgREST cannot embed it here.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        role,
        group_id,
        created_at,
        groups!profiles_group_id_fkey (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    const { data: userRoles } = await supabase
      .from('app_user_roles')
      .select('user_id, role_code');

    const rolesByUser: Record<string, { role_code: string }[]> = {};
    (userRoles || []).forEach((ur: any) => {
      (rolesByUser[ur.user_id] ||= []).push({ role_code: ur.role_code });
    });

    const users = (profiles || []).map((p: any) => ({
      ...p,
      app_user_roles: rolesByUser[p.id] || [],
    }));

    return { success: true, users };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des utilisateurs.' };
  }
}

export async function createUserAction(formData: FormData) {
  try {
    const actorContext = await assertPermission('users:create');

    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string) || 'Eglise2026!';
    const firstName = (formData.get('first_name') as string)?.trim();
    const lastName = (formData.get('last_name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || null;
    const roleCode = (formData.get('role_code') as string) || 'shepherd';
    const groupId = (formData.get('group_id') as string) || null;

    if (!email || !firstName || !lastName) {
      return { error: 'L\'email, le prénom et le nom sont obligatoires.' };
    }

    const adminSupabase = createAdminClient();

    // 1. Create auth user directly with service_role
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: roleCode,
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Erreur lors de la création du compte auth.' };
    }

    const newUserId = authData.user.id;

    // 2. Insert into profiles table
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUserId,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: roleCode as any,
        group_id: groupId || null,
      });

    if (profileError) {
      // Rollback auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(newUserId);
      return { error: profileError.message };
    }

    // 3. Insert into app_user_roles
    await adminSupabase
      .from('app_user_roles')
      .upsert({ user_id: newUserId, role_code: roleCode });

    // 4. Audit Log
    await logAuditAction({
      action: 'USER_CREATED',
      resourceType: 'user',
      resourceId: newUserId,
      newValues: { email, firstName, lastName, roleCode, groupId },
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { success: true, message: `Utilisateur ${firstName} ${lastName} créé avec succès !` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la création de l\'utilisateur.' };
  }
}

export async function updateUserRoleAction(userId: string, newRoleCode: string, groupId?: string | null) {
  try {
    await assertPermission('users:edit');
    const adminSupabase = createAdminClient();

    // Get old values for audit log
    const { data: oldProfile } = await adminSupabase
      .from('profiles')
      .select('role, group_id')
      .eq('id', userId)
      .single();

    // Update profile
    const updatePayload: any = { role: newRoleCode };
    if (groupId !== undefined) {
      updatePayload.group_id = groupId || null;
    }

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (profileError) {
      return { error: profileError.message };
    }

    // Update app_user_roles (delete old primary and set new one)
    await adminSupabase.from('app_user_roles').delete().eq('user_id', userId);
    await adminSupabase.from('app_user_roles').insert({ user_id: userId, role_code: newRoleCode });

    await logAuditAction({
      action: 'USER_ROLE_UPDATED',
      resourceType: 'user',
      resourceId: userId,
      oldValues: oldProfile,
      newValues: { role: newRoleCode, group_id: groupId },
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { success: true, message: 'Rôle et affectation mis à jour avec succès.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la mise à jour de l\'utilisateur.' };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await assertPermission('users:delete');
    const adminSupabase = createAdminClient();

    const { data: oldProfile } = await adminSupabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', userId)
      .single();

    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error) {
      return { error: error.message };
    }

    await logAuditAction({
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: userId,
      oldValues: oldProfile,
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { success: true, message: 'Compte utilisateur supprimé avec succès.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la suppression du compte.' };
  }
}

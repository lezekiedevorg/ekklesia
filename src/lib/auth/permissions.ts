import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export interface UserContext {
  user: any;
  profile: any;
  roles: string[];
  permissions: string[];
}

/**
 * Retrieves the current user's profile, roles, and permissions using React cache
 * to deduplicate calls across the same server render request.
 */
export const getCurrentUserContext = cache(async (): Promise<UserContext | null> => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user roles
  const { data: userRoles } = await supabase
    .from('app_user_roles')
    .select('role_code')
    .eq('user_id', user.id);

  let roles = (userRoles || []).map(r => r.role_code);
  if (roles.length === 0 && profile?.role) {
    roles = [profile.role];
  }

  // Fetch permissions (using RPC or direct join)
  const { data: rpcPerms } = await supabase.rpc('get_user_permissions', {
    p_user_id: user.id
  });

  const permissions = (rpcPerms || []).map((p: any) => p.permission_code);

  // If user is super_admin or admin, make sure they have admin access
  if (roles.includes('super_admin') || roles.includes('admin')) {
    if (!permissions.includes('admin:access')) permissions.push('admin:access');
  }

  return {
    user,
    profile: profile || {},
    roles,
    permissions,
  };
});

/**
 * Check if current authenticated user has a specific permission
 */
export async function hasPermission(permissionCode: string): Promise<boolean> {
  const context = await getCurrentUserContext();
  if (!context) return false;
  
  if (context.roles.includes('super_admin')) return true;
  return context.permissions.includes(permissionCode);
}

/**
 * Check if current authenticated user has any of the specified permissions
 */
export async function hasAnyPermission(permissionCodes: string[]): Promise<boolean> {
  const context = await getCurrentUserContext();
  if (!context) return false;
  
  if (context.roles.includes('super_admin')) return true;
  return permissionCodes.some(code => context.permissions.includes(code));
}

/**
 * Check if current authenticated user has a specific role
 */
export async function hasRole(roleCode: string): Promise<boolean> {
  const context = await getCurrentUserContext();
  if (!context) return false;
  
  return context.roles.includes(roleCode);
}

/**
 * Guard function for Server Actions and Protected Pages:
 * Throws an Error if the user does not have the required permission.
 */
export async function assertPermission(permissionCode: string, customMessage?: string): Promise<UserContext> {
  const context = await getCurrentUserContext();
  if (!context) {
    throw new Error('Non authentifié. Veuillez vous connecter pour continuer.');
  }

  if (context.roles.includes('super_admin')) {
    return context;
  }

  if (!context.permissions.includes(permissionCode)) {
    throw new Error(customMessage || `Accès non autorisé. Permission requise : ${permissionCode}`);
  }

  return context;
}

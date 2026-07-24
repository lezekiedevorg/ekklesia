'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export interface MemberInput {
  first_name: string;
  last_name: string;
  phone?: string | null;
  shepherd_id?: string | null;
  invited_by_member_id?: string | null;
  residence_location?: string | null;
  status?: string;
  current_class?: string;
}

export async function getMembersAction() {
  try {
    await assertPermission('members:view_all');
    const supabase = await createClient();

    const [membersRes, shepherdsRes] = await Promise.all([
      supabase
        .from('members')
        .select('id, first_name, last_name, phone, shepherd_id, invited_by_member_id, residence_location, status, current_class, consecutive_absences, last_seen_date, archived_at, created_at')
        .order('first_name', { ascending: true }),
      supabase.from('profiles').select('id, first_name, last_name, role').order('first_name'),
    ]);

    if (membersRes.error) return { error: membersRes.error.message };

    return {
      success: true,
      members: membersRes.data || [],
      shepherds: shepherdsRes.data || [],
    };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des fidèles.' };
  }
}

function clean(data: MemberInput) {
  return {
    first_name: data.first_name?.trim(),
    last_name: data.last_name?.trim(),
    phone: data.phone?.trim() || null,
    shepherd_id: data.shepherd_id || null,
    invited_by_member_id: data.invited_by_member_id || null,
    residence_location: data.residence_location?.trim() || null,
    status: data.status || 'new',
    current_class: data.current_class || 'none',
  };
}

export async function createMemberAction(data: MemberInput) {
  try {
    await assertPermission('members:create');
    const supabase = await createClient();

    const payload = clean(data);
    if (!payload.first_name || !payload.last_name) {
      return { error: 'Le prénom et le nom sont obligatoires.' };
    }

    const { data: member, error } = await supabase.from('members').insert(payload).select().single();
    if (error) return { error: error.message };

    await logAuditAction({
      action: 'MEMBER_CREATED',
      resourceType: 'member',
      resourceId: member.id,
      newValues: { name: `${payload.first_name} ${payload.last_name}` },
    });

    revalidatePath('/admin/members');
    return { success: true, message: `Fidèle ${payload.first_name} ${payload.last_name} ajouté.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la création du fidèle.' };
  }
}

export async function updateMemberAction(id: string, data: MemberInput) {
  try {
    await assertPermission('members:edit');
    const supabase = await createClient();

    const payload = clean(data);
    if (!payload.first_name || !payload.last_name) {
      return { error: 'Le prénom et le nom sont obligatoires.' };
    }

    const { error } = await supabase.from('members').update(payload).eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({
      action: 'MEMBER_UPDATED',
      resourceType: 'member',
      resourceId: id,
      newValues: { name: `${payload.first_name} ${payload.last_name}`, status: payload.status },
    });

    revalidatePath('/admin/members');
    return { success: true, message: 'Fidèle mis à jour.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la mise à jour du fidèle.' };
  }
}

export async function archiveMemberAction(id: string, archive: boolean) {
  try {
    await assertPermission('members:edit');
    const supabase = await createClient();

    const payload = archive
      ? { status: 'archived', archived_at: new Date().toISOString() }
      : { status: 'member', archived_at: null };

    const { error } = await supabase.from('members').update(payload).eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({
      action: archive ? 'MEMBER_ARCHIVED' : 'MEMBER_RESTORED',
      resourceType: 'member',
      resourceId: id,
    });

    revalidatePath('/admin/members');
    return { success: true, message: archive ? 'Fidèle archivé.' : 'Fidèle restauré.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de l\'archivage.' };
  }
}

export async function deleteMemberAction(id: string) {
  try {
    await assertPermission('members:delete');
    const supabase = await createClient();

    const { data: old } = await supabase.from('members').select('first_name, last_name').eq('id', id).single();
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({
      action: 'MEMBER_DELETED',
      resourceType: 'member',
      resourceId: id,
      oldValues: old || undefined,
    });

    revalidatePath('/admin/members');
    return { success: true, message: 'Fidèle supprimé définitivement.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la suppression.' };
  }
}

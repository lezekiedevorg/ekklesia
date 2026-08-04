'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getAttendanceAction(start: string, end: string, program?: string) {
  try {
    await assertPermission('members:view_all');
    const supabase = await createClient();

    let query = supabase
      .from('attendance')
      .select('id, date, program_type, is_present, member_id, members(first_name, last_name, status)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .limit(500);

    if (program && program !== 'all') query = query.eq('program_type', program);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { success: true, records: data || [] };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des présences.' };
  }
}

export async function getAttendanceMembersAction() {
  try {
    await assertPermission('members:view_all');
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, status')
      .is('archived_at', null)
      .order('first_name');
    if (error) return { error: error.message };
    return { success: true, members: data || [] };
  } catch (err: any) {
    return { error: err.message || 'Erreur.' };
  }
}

export async function upsertAttendanceAction(data: {
  member_id: string;
  date: string;
  program_type: string;
  is_present: boolean;
}) {
  try {
    await assertPermission('members:edit');
    const supabase = await createClient();

    if (!data.member_id || !data.date || !data.program_type) {
      return { error: 'Fidèle, date et programme sont obligatoires.' };
    }

    const { error } = await supabase
      .from('attendance')
      .upsert(data, { onConflict: 'member_id,date,program_type' });
    if (error) return { error: error.message };

    await logAuditAction({ action: 'ATTENDANCE_UPSERTED', resourceType: 'attendance', resourceId: `${data.member_id}:${data.date}:${data.program_type}` });

    revalidatePath('/admin/attendance');
    return { success: true, message: 'Pointage enregistré.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de l\'enregistrement du pointage.' };
  }
}

export async function toggleAttendanceAction(id: string, isPresent: boolean) {
  try {
    await assertPermission('members:edit');
    const supabase = await createClient();
    const { error } = await supabase.from('attendance').update({ is_present: isPresent }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/attendance');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Erreur.' };
  }
}

export async function deleteAttendanceAction(id: string) {
  try {
    await assertPermission('members:edit');
    const supabase = await createClient();
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) return { error: error.message };
    await logAuditAction({ action: 'ATTENDANCE_DELETED', resourceType: 'attendance', resourceId: id });
    revalidatePath('/admin/attendance');
    return { success: true, message: 'Pointage supprimé.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la suppression.' };
  }
}

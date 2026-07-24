'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getReportsAction() {
  try {
    await assertPermission('reports:view_all');
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('weekly_reports')
      .select('id, shepherd_id, week_end_date, report_date, status, report_data, submitted_at, profiles(first_name, last_name)')
      .order('week_end_date', { ascending: false })
      .limit(300);

    if (error) return { error: error.message };
    return { success: true, reports: data || [] };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des rapports.' };
  }
}

export async function setReportStatusAction(id: string, status: 'submitted' | 'approved') {
  try {
    await assertPermission('reports:validate');
    const supabase = await createClient();

    const payload: any = { status };
    if (status === 'approved') payload.approved_at = new Date().toISOString();

    const { error } = await supabase.from('weekly_reports').update(payload).eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({
      action: status === 'approved' ? 'REPORT_APPROVED' : 'REPORT_REOPENED',
      resourceType: 'weekly_report',
      resourceId: id,
    });

    revalidatePath('/admin/reports');
    return { success: true, message: status === 'approved' ? 'Rapport validé.' : 'Rapport rouvert.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors du changement de statut.' };
  }
}

export async function deleteReportAction(id: string) {
  try {
    await assertPermission('reports:validate');
    const supabase = await createClient();

    const { error } = await supabase.from('weekly_reports').delete().eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({ action: 'REPORT_DELETED', resourceType: 'weekly_report', resourceId: id });

    revalidatePath('/admin/reports');
    return { success: true, message: 'Rapport supprimé.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la suppression du rapport.' };
  }
}

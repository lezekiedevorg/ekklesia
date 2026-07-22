'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';

export async function getAuditLogsAction(options?: {
  limit?: number;
  actionFilter?: string;
  actorIdFilter?: string;
}) {
  try {
    await assertPermission('logs:view');
    const supabase = await createClient();

    let query = supabase
      .from('app_audit_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        created_at,
        actor_id
      `)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 100);

    if (options?.actionFilter && options.actionFilter !== 'ALL') {
      query = query.eq('action', options.actionFilter);
    }
    if (options?.actorIdFilter && options.actorIdFilter !== 'ALL') {
      query = query.eq('actor_id', options.actorIdFilter);
    }

    const { data: logs, error } = await query;
    if (error) return { error: error.message };

    // Fetch actor profile names to enrich logs
    const actorIds = Array.from(new Set((logs || []).map(l => l.actor_id).filter(Boolean)));
    let actorMap: Record<string, string> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', actorIds);

      (profiles || []).forEach(p => {
        actorMap[p.id] = `${p.first_name} ${p.last_name} (${p.role})`;
      });
    }

    const enrichedLogs = (logs || []).map(l => ({
      ...l,
      actor_name: l.actor_id ? (actorMap[l.actor_id] || l.actor_id) : 'Système',
    }));

    return { success: true, logs: enrichedLogs };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des journaux d\'audit.' };
  }
}

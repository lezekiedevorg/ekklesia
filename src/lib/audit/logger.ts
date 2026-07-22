import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export interface AuditLogOptions {
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
}

/**
 * Logs an administrative or sensitive action to the `app_audit_logs` table.
 * Designed to fail gracefully without breaking the main business logic if logging fails.
 */
export async function logAuditAction(options: AuditLogOptions): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let ipAddress = 'unknown';
    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    } catch {
      // In case headers() is called outside a request context
    }

    await supabase.from('app_audit_logs').insert({
      actor_id: user?.id || null,
      action: options.action,
      resource_type: options.resourceType || null,
      resource_id: options.resourceId || null,
      old_values: options.oldValues ? JSON.parse(JSON.stringify(options.oldValues)) : null,
      new_values: options.newValues ? JSON.parse(JSON.stringify(options.newValues)) : null,
      ip_address: ipAddress,
    });
  } catch (error) {
    console.error('[AuditLogger] Erreur lors de la journalisation :', error);
  }
}

import { getAuditLogsAction } from '@/app/admin/actions/logs';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';

export default async function AdminLogsPage() {
  const result = await getAuditLogsAction({ limit: 150 });
  const logs = result.success ? result.logs || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Journaux d&apos;Audit & Sécurité (`app_audit_logs`)
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Traçabilité complète et infalsifiable de toutes les créations de comptes, modifications de rôles, changements de règles et tentatives d&apos;accès.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <AuditLogsViewer initialLogs={logs} />
    </div>
  );
}

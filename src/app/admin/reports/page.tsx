import { getReportsAction } from '@/app/admin/actions/reports';
import ReportsManager from '@/components/admin/ReportsManager';

export default async function AdminReportsPage() {
  const result = await getReportsAction();
  const reports = result.success ? result.reports || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Rapports Hebdomadaires des Bergers
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Consulter, valider, rouvrir ou supprimer les rapports soumis par les bergers.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <ReportsManager initialReports={reports as any} />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import { setReportStatusAction, deleteReportAction } from '@/app/admin/actions/reports';

interface Report {
  id: string;
  shepherd_id: string;
  week_end_date: string | null;
  report_date: string | null;
  status: 'submitted' | 'approved';
  report_data: Record<string, any> | null;
  submitted_at: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

export default function ReportsManager({ initialReports }: { initialReports: Report[] }) {
  const router = useRouter();
  const [reports] = useState<Report[]>(initialReports);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved'>('all');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Report | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const name = (r: Report) => (r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : 'Berger inconnu');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (q && !name(r).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reports, statusFilter, search]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function notify(result: { error?: string; message?: string }) {
    if (result.error) { setError(result.error); setMessage(null); }
    else { setMessage(result.message || 'OK'); setError(null); router.refresh(); }
  }

  async function toggleStatus(r: Report) {
    setBusyId(r.id);
    notify(await setReportStatusAction(r.id, r.status === 'approved' ? 'submitted' : 'approved'));
    setBusyId(null);
  }

  async function remove(r: Report) {
    if (!confirm(`Supprimer le rapport de ${name(r)} ? Action irréversible.`)) return;
    setBusyId(r.id);
    notify(await deleteReportAction(r.id));
    setBusyId(null);
  }

  return (
    <div className="space-y-5">
      {message && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">✅ {message}</div>}
      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">⚠️ {error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un berger…" className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED] min-w-[220px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED]">
          <option value="all">Tous les statuts</option>
          <option value="submitted">Soumis</option>
          <option value="approved">Validés</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5 min-w-[180px]">Berger</th>
              <th className="py-3.5 px-4">Semaine</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400 font-medium">Aucun rapport.</td></tr>}
            {paged.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-800">{name(r)}</td>
                <td className="py-3.5 px-4 text-slate-600">{r.week_end_date || r.report_date || '—'}</td>
                <td className="py-3.5 px-4">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {r.status === 'approved' ? 'Validé' : 'Soumis'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setViewing(r)} title="Voir" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                    <button onClick={() => toggleStatus(r)} disabled={busyId === r.id} title={r.status === 'approved' ? 'Rouvrir' : 'Valider'} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">{r.status === 'approved' ? 'lock_open' : 'task_alt'}</span></button>
                    <button onClick={() => remove(r)} disabled={busyId === r.id} title="Supprimer" className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <Modal open={viewing !== null} onClose={() => setViewing(null)} maxWidth="max-w-2xl">
        <h2 className="text-xl font-black text-[#1e1b4b] mb-1">Rapport — {viewing && name(viewing)}</h2>
        <p className="text-xs text-slate-500 mb-4">{viewing?.week_end_date || viewing?.report_date}</p>
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap break-words text-slate-700">
          {viewing ? JSON.stringify(viewing.report_data ?? {}, null, 2) : ''}
        </pre>
      </Modal>
    </div>
  );
}

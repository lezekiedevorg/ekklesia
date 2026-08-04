'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/common/Pagination';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  created_at: string;
  actor_id: string | null;
  actor_name?: string;
}

export default function AuditLogsViewer({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(search.toLowerCase())) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(search.toLowerCase()));
    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  useEffect(() => { setPage(1); }, [search, actionFilter]);
  const pagedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) {
      return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">Création</span>;
    }
    if (action.includes('UPDATE')) {
      return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-800 border border-indigo-500/30">Modification</span>;
    }
    if (action.includes('DELETE')) {
      return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 border border-rose-500/30">Suppression</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">Audit</span>;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Rechercher par action, acteur ou ID ressource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="ALL">Toutes les actions</option>
            <option value="CREATE">Créations (CREATE)</option>
            <option value="UPDATE">Modifications (UPDATE)</option>
            <option value="DELETE">Suppressions (DELETE)</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-2xl">
          {filteredLogs.length} entrées trouvées
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Horodatage</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Acteur / Opérateur</th>
                <th className="py-4 px-6">Ressource concernée</th>
                <th className="py-4 px-6">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Aucun journal d&apos;audit ne correspond à vos critères.
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                      <div>{new Date(log.created_at).toLocaleDateString('fr-FR')}</div>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="font-bold text-slate-900 text-xs font-mono">{log.action}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#1e1b4b] text-xs">{log.actor_name || log.actor_id || 'Système'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl inline-block border border-indigo-100">
                        {log.resource_type || 'N/A'}
                      </div>
                      {log.resource_id && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">{log.resource_id}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>🔍</span>
                        <span>Payload JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filteredLogs.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#1e1b4b]">Détail du journal d&apos;audit</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1">Action:</span>
                <span className="font-mono font-bold text-[#1e1b4b]">{selectedLog.action}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1">Acteur:</span>
                <span className="font-bold text-[#1e1b4b]">{selectedLog.actor_name || selectedLog.actor_id}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Anciennes valeurs (old_values)</label>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'null'}
                </pre>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Nouvelles valeurs (new_values)</label>
                <pre className="p-4 rounded-2xl bg-slate-900 text-sky-400 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null'}
                </pre>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 rounded-2xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import { PROGRAM_DEFINITIONS, ProgramDefinition } from '@/lib/constants/programs';
import { getProgramsClient } from '@/lib/utils/programs-data';
import {
  getAttendanceAction,
  getAttendanceMembersAction,
  upsertAttendanceAction,
  toggleAttendanceAction,
  deleteAttendanceAction,
} from '@/app/admin/actions/attendance';

interface Record_ {
  id: string;
  date: string;
  program_type: string;
  is_present: boolean;
  member_id: string;
  members?: { first_name: string; last_name: string; status?: string } | null;
}
interface MemberLite { id: string; first_name: string; last_name: string; status?: string }

function isoDaysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}
const TODAY = new Date().toISOString().split('T')[0];

export default function AttendanceManager() {
  const [start, setStart] = useState(isoDaysAgo(7));
  const [end, setEnd] = useState(TODAY);
  const [program, setProgram] = useState('all');
  const [records, setRecords] = useState<Record_[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ member_id: '', date: TODAY, program_type: PROGRAM_DEFINITIONS[0].id, is_present: true });
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<ProgramDefinition[]>(PROGRAM_DEFINITIONS);
  const programLabel = (id: string) => programs.find((p) => p.id === id)?.label || id;

  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'newcomers' | 'members'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch = !q || `${r.members?.first_name || ''} ${r.members?.last_name || ''}`.toLowerCase().includes(q);
      const isNewcomer = r.members?.status === 'new';
      const matchesFilter = memberFilter === 'all' || (memberFilter === 'newcomers' && isNewcomer) || (memberFilter === 'members' && !isNewcomer);
      return matchesSearch && matchesFilter;
    });
  }, [records, search, memberFilter]);
  useEffect(() => { setPage(1); }, [search, start, end, program]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { getProgramsClient().then(setPrograms); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAttendanceAction(start, end, program);
    if (result.error) setError(result.error);
    else setRecords((result.records as any) || []);
    setLoading(false);
  }, [start, end, program]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getAttendanceMembersAction().then((r) => { if (r.success) setMembers((r.members as any) || []); });
  }, []);

  function flash(result: { error?: string; message?: string }) {
    if (result.error) { setError(result.error); setMessage(null); }
    else { setMessage(result.message || 'OK'); setError(null); }
  }

  async function toggle(r: Record_) {
    setBusyId(r.id);
    const result = await toggleAttendanceAction(r.id, !r.is_present);
    if (result.error) flash(result);
    else setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_present: !x.is_present } : x)));
    setBusyId(null);
  }

  async function remove(r: Record_) {
    if (!confirm('Supprimer ce pointage ?')) return;
    setBusyId(r.id);
    const result = await deleteAttendanceAction(r.id);
    flash(result);
    if (!result.error) setRecords((prev) => prev.filter((x) => x.id !== r.id));
    setBusyId(null);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await upsertAttendanceAction(form);
    setSaving(false);
    flash(result);
    if (!result.error) { setShowAdd(false); load(); }
  }

  const inputCls = 'px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED]';

  return (
    <div className="space-y-5">
      {message && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">✅ {message}</div>}
      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">⚠️ {error}</div>}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#6E6D79]">calendar_today</span>
          <input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} className={inputCls} />
          <span className="text-xs text-[#6E6D79]">→</span>
          <input type="date" value={end} min={start} max={TODAY} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          <select value={program} onChange={(e) => setProgram(e.target.value)} className={inputCls}>
            <option value="all">Tous programmes</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un fidèle…" className={`${inputCls} min-w-[170px]`} />
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {([['all', 'Tous'], ['newcomers', 'Nouveaux'], ['members', 'Membres']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setMemberFilter(val)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${memberFilter === val ? 'bg-white text-[#1e1b4b] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px] text-[#fea619]">add_task</span>
          Ajouter un pointage
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5 min-w-[160px]">Fidèle</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Programme</th>
              <th className="py-3.5 px-4 text-center">Présent</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-medium">Chargement…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-medium">Aucun pointage sur cette période.</td></tr>}
            {!loading && paged.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-5 font-bold text-slate-800">
                  {r.members ? (
                    <span className="flex items-center gap-2">
                      {r.members.first_name} {r.members.last_name}
                      {r.members.status === 'new' && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Nouveau</span>}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-4 text-slate-600">{r.date}</td>
                <td className="py-3 px-4 text-slate-600">{programLabel(r.program_type)}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => toggle(r)} disabled={busyId === r.id} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${r.is_present ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
                    {r.is_present ? 'Présent' : 'Absent'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end">
                    <button onClick={() => remove(r)} disabled={busyId === r.id} title="Supprimer" className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!loading && <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <h2 className="text-xl font-black text-[#1e1b4b] mb-5">Ajouter / corriger un pointage</h2>
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Fidèle</label>
            <select required value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} className={`w-full ${inputCls}`}>
              <option value="">— Sélectionner —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}{m.status === 'new' ? ' (Nouveau)' : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Date</label>
              <input type="date" required max={TODAY} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`w-full ${inputCls}`} />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Programme</label>
              <select value={form.program_type} onChange={(e) => setForm({ ...form, program_type: e.target.value })} className={`w-full ${inputCls}`}>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.is_present} onChange={(e) => setForm({ ...form, is_present: e.target.checked })} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-bold text-slate-700">Présent</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] shadow-md transition-all disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

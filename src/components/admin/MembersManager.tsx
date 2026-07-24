'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import {
  createMemberAction,
  updateMemberAction,
  archiveMemberAction,
  deleteMemberAction,
  type MemberInput,
} from '@/app/admin/actions/members';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  shepherd_id: string | null;
  invited_by_member_id: string | null;
  residence_location: string | null;
  status: string;
  current_class: string;
  consecutive_absences: number;
  archived_at: string | null;
}

interface Shepherd {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nouveau' },
  { value: 'member', label: 'Membre' },
  { value: 'absent_to_relaunch', label: 'À relancer' },
  { value: 'archived', label: 'Archivé' },
];
const CLASS_OPTIONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'tuesday_class', label: 'Classe mardi' },
  { value: 'wednesday_class', label: 'Classe mercredi' },
  { value: 'completed', label: 'Terminée' },
];

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-sky-50 text-sky-700 border-sky-200',
  member: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent_to_relaunch: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const EMPTY: MemberInput = {
  first_name: '', last_name: '', phone: '', shepherd_id: '', invited_by_member_id: '',
  residence_location: '', status: 'new', current_class: 'none',
};

export default function MembersManager({
  initialMembers,
  shepherds,
}: {
  initialMembers: Member[];
  shepherds: Shepherd[];
}) {
  const router = useRouter();
  const [members] = useState<Member[]>(initialMembers);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shepherdName = (id: string | null) => {
    const s = shepherds.find((x) => x.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const isArchived = m.status === 'archived' || !!m.archived_at;
      if (tab === 'active' && isArchived) return false;
      if (tab === 'archived' && !isArchived) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (q && !`${m.first_name} ${m.last_name} ${m.phone || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [members, tab, search, statusFilter]);

  useEffect(() => { setPage(1); }, [tab, search, statusFilter]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() {
    setForm(EMPTY);
    setEditingId(null);
    setModalMode('create');
  }
  function openEdit(m: Member) {
    setForm({
      first_name: m.first_name, last_name: m.last_name, phone: m.phone || '',
      shepherd_id: m.shepherd_id || '', invited_by_member_id: m.invited_by_member_id || '',
      residence_location: m.residence_location || '', status: m.status, current_class: m.current_class,
    });
    setEditingId(m.id);
    setModalMode('edit');
  }

  function notify(result: { error?: string; message?: string }) {
    if (result.error) { setError(result.error); setMessage(null); }
    else { setMessage(result.message || 'OK'); setError(null); router.refresh(); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = editingId
      ? await updateMemberAction(editingId, form)
      : await createMemberAction(form);
    setSaving(false);
    if (!result.error) setModalMode(null);
    notify(result);
  }

  async function toggleArchive(m: Member) {
    setBusyId(m.id);
    const archived = m.status === 'archived' || !!m.archived_at;
    notify(await archiveMemberAction(m.id, !archived));
    setBusyId(null);
  }

  async function remove(m: Member) {
    if (!confirm(`Supprimer définitivement ${m.first_name} ${m.last_name} ? Cette action est irréversible.`)) return;
    setBusyId(m.id);
    notify(await deleteMemberAction(m.id));
    setBusyId(null);
  }

  const inputCls = 'w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]';
  const labelCls = 'block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5';

  return (
    <div className="space-y-5">
      {message && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">✅ {message}</div>}
      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">⚠️ {error}</div>}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['active', 'archived'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-[#1E1B4B] text-white shadow-md' : 'bg-white text-[#6E6D79] border border-slate-200 hover:bg-slate-50'}`}
            >
              {t === 'active' ? 'Actifs' : 'Archivés'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, téléphone)…"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED] min-w-[200px]"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED]">
            <option value="all">Tous statuts</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-[18px] text-[#fea619]">person_add</span>
            Nouveau fidèle
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5 min-w-[180px]">Fidèle</th>
              <th className="py-3.5 px-4">Téléphone</th>
              <th className="py-3.5 px-4">Berger</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-medium">Aucun fidèle.</td></tr>
            )}
            {paged.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5">
                  <div className="font-bold text-slate-800">{m.first_name} {m.last_name}</div>
                  {m.residence_location && <div className="text-[11px] text-slate-400">{m.residence_location}</div>}
                </td>
                <td className="py-3.5 px-4 text-slate-600">{m.phone || '—'}</td>
                <td className="py-3.5 px-4 text-slate-600">{shepherdName(m.shepherd_id)}</td>
                <td className="py-3.5 px-4">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[m.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {STATUS_OPTIONS.find((s) => s.value === m.status)?.label || m.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => openEdit(m)} disabled={busyId === m.id} title="Modifier" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => toggleArchive(m)} disabled={busyId === m.id} title={m.status === 'archived' || m.archived_at ? 'Restaurer' : 'Archiver'} className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors disabled:opacity-40">
                      <span className="material-symbols-outlined text-[18px]">{m.status === 'archived' || m.archived_at ? 'unarchive' : 'archive'}</span>
                    </button>
                    <button onClick={() => remove(m)} disabled={busyId === m.id} title="Supprimer" className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-40">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Create / Edit modal */}
      <Modal open={modalMode !== null} onClose={() => setModalMode(null)}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-[#fea619] flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[18px]">{modalMode === 'edit' ? 'edit' : 'person_add'}</span>
          </div>
          <h2 className="text-xl font-black text-[#1e1b4b]">{modalMode === 'edit' ? 'Modifier le fidèle' : 'Nouveau fidèle'}</h2>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prénom</label>
              <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nom</label>
              <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Téléphone</label>
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Résidence</label>
              <input value={form.residence_location || ''} onChange={(e) => setForm({ ...form, residence_location: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Berger référent</label>
            <select value={form.shepherd_id || ''} onChange={(e) => setForm({ ...form, shepherd_id: e.target.value })} className={inputCls}>
              <option value="">— Aucun —</option>
              {shepherds.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Statut</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Classe</label>
              <select value={form.current_class} onChange={(e) => setForm({ ...form, current_class: e.target.value })} className={inputCls}>
                {CLASS_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalMode(null)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-md transition-all disabled:opacity-50">
              {saving ? 'Enregistrement…' : modalMode === 'edit' ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

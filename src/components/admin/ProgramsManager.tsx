'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import {
  createProgramAction,
  updateProgramAction,
  deleteProgramAction,
  type ProgramInput,
} from '@/app/admin/actions/programs';

interface Program {
  id: string;
  key: string;
  label: string;
  icon: string;
  day_of_week: number | null;
  eligibility_class: string | null;
  is_active: boolean;
  sort_order: number;
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const CLASS_OPTIONS = [
  { value: '', label: 'Aucune (tous éligibles)' },
  { value: 'tuesday_class', label: 'Classe mardi (affermissement)' },
  { value: 'wednesday_class', label: 'Classe mercredi (fondements)' },
];

const EMPTY: ProgramInput = { key: '', label: '', icon: '📅', day_of_week: null, eligibility_class: '', is_active: true, sort_order: 100 };

export default function ProgramsManager({ initialPrograms }: { initialPrograms: Program[] }) {
  const router = useRouter();
  const [programs] = useState<Program[]>(initialPrograms);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => `${p.label} ${p.key}`.toLowerCase().includes(q));
  }, [programs, search]);
  useEffect(() => { setPage(1); }, [search]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function notify(r: { error?: string; message?: string }) {
    if (r.error) { setError(r.error); setMessage(null); }
    else { setMessage(r.message || 'OK'); setError(null); router.refresh(); }
  }

  function openCreate() { setForm({ ...EMPTY, sort_order: (programs.length + 1) * 10 }); setEditingId(null); setModalMode('create'); }
  function openEdit(p: Program) {
    setForm({ key: p.key, label: p.label, icon: p.icon, day_of_week: p.day_of_week, eligibility_class: p.eligibility_class || '', is_active: p.is_active, sort_order: p.sort_order });
    setEditingId(p.id);
    setModalMode('edit');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = editingId ? await updateProgramAction(editingId, form) : await createProgramAction(form);
    setSaving(false);
    if (!r.error) setModalMode(null);
    notify(r);
  }

  async function toggleActive(p: Program) {
    setBusyId(p.id);
    notify(await updateProgramAction(p.id, { is_active: !p.is_active }));
    setBusyId(null);
  }

  async function remove(p: Program) {
    if (!confirm(`Supprimer le programme "${p.label}" ?`)) return;
    setBusyId(p.id);
    notify(await deleteProgramAction(p.id));
    setBusyId(null);
  }

  const inputCls = 'w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]';
  const labelCls = 'block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5';

  return (
    <div className="space-y-5">
      {message && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">✅ {message}</div>}
      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">⚠️ {error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un programme…"
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED] min-w-[220px]"
        />
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
          <span className="material-symbols-outlined text-[18px] text-[#fea619]">add_circle</span>
          Nouveau programme
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5 min-w-[220px]">Programme</th>
              <th className="py-3.5 px-4">Jour</th>
              <th className="py-3.5 px-4">Éligibilité</th>
              <th className="py-3.5 px-4 text-center">Ordre</th>
              <th className="py-3.5 px-4 text-center">Actif</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-400 font-medium">Aucun programme.</td></tr>}
            {paged.map((p) => (
              <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <div className="font-bold text-slate-800">{p.label}</div>
                      <div className="text-[11px] font-mono text-slate-400">{p.key}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{p.day_of_week != null ? DAYS[p.day_of_week] : '—'}</td>
                <td className="py-3.5 px-4 text-slate-600">{p.eligibility_class ? CLASS_OPTIONS.find((c) => c.value === p.eligibility_class)?.label || p.eligibility_class : 'Tous'}</td>
                <td className="py-3.5 px-4 text-center text-slate-600">{p.sort_order}</td>
                <td className="py-3.5 px-4 text-center">
                  <button onClick={() => toggleActive(p)} disabled={busyId === p.id} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {p.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => openEdit(p)} disabled={busyId === p.id} title="Modifier" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onClick={() => remove(p)} disabled={busyId === p.id} title="Supprimer" className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <Modal open={modalMode !== null} onClose={() => setModalMode(null)}>
        <h2 className="text-xl font-black text-[#1e1b4b] mb-5">{modalMode === 'edit' ? 'Modifier le programme' : 'Nouveau programme'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div>
              <label className={labelCls}>Libellé</label>
              <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls} placeholder="Ex: Samedi (Réunion de prière)" />
            </div>
            <div className="w-24">
              <label className={labelCls}>Icône</label>
              <input value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputCls} placeholder="📅" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Clé technique</label>
            <input
              required
              disabled={modalMode === 'edit'}
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className={`${inputCls} font-mono disabled:opacity-60`}
              placeholder="ex: saturday_prayer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minuscules/chiffres/underscores. {modalMode === 'edit' ? 'Immuable (référencée par les pointages).' : 'Immuable après création.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Jour</label>
              <select value={form.day_of_week ?? ''} onChange={(e) => setForm({ ...form, day_of_week: e.target.value === '' ? null : Number(e.target.value) })} className={inputCls}>
                <option value="">—</option>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ordre</label>
              <input type="number" value={form.sort_order ?? 100} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Éligibilité (classe requise)</label>
            <select value={form.eligibility_class || ''} onChange={(e) => setForm({ ...form, eligibility_class: e.target.value })} className={inputCls}>
              {CLASS_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-bold text-slate-700">Programme actif</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalMode(null)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] shadow-md transition-all disabled:opacity-50">{saving ? 'Enregistrement…' : modalMode === 'edit' ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

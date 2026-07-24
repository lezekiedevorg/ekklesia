"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/common/Modal";
import { registerNewcomer } from "@/app/admin/newcomers/actions";

interface Newcomer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  residence_location: string | null;
  status: string;
  created_at: string;
  sundayPresent: number;
}

function isoDaysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
}
const TODAY = new Date().toISOString().split("T")[0];

export default function NewcomerFriendDashboard({ firstName }: { firstName: string }) {
  const supabase = createClient();
  const [mode, setMode] = useState<"day" | "week" | "month">("month");
  const [start, setStart] = useState(isoDaysAgo(30));

  const [welcomedInPeriod, setWelcomedInPeriod] = useState(0);
  const [newcomers, setNewcomers] = useState<Newcomer[]>([]);
  const [retention, setRetention] = useState(0);
  const [sundayRate, setSundayRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", residence_location: "", notes: "" });

  function applyMode(m: "day" | "week" | "month") {
    setMode(m);
    setStart(m === "day" ? TODAY : m === "week" ? isoDaysAgo(7) : isoDaysAgo(30));
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Nouveaux accueillis sur la période (enregistrements)
      const regRes = await supabase
        .from("newcomer_registrations")
        .select("id", { count: "exact" })
        .gte("registration_date", start)
        .lte("registration_date", TODAY);
      setWelcomedInPeriod(regRes.count || 0);

      // Nouveaux en cours d'intégration (status 'new')
      const { data: mem } = await supabase
        .from("members")
        .select("id, first_name, last_name, phone, residence_location, status, created_at")
        .eq("status", "new")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      const newcomerMembers = (mem || []) as any[];
      const ids = newcomerMembers.map((m) => m.id);

      // Présences dimanche des nouveaux
      let sundayRows: { member_id: string; is_present: boolean }[] = [];
      if (ids.length > 0) {
        const attRes = await supabase
          .from("attendance")
          .select("member_id, is_present")
          .eq("program_type", "sunday_service")
          .in("member_id", ids);
        sundayRows = (attRes.data || []) as any[];
      }

      const presentByMember: Record<string, number> = {};
      let totalSunday = 0, presentSunday = 0;
      sundayRows.forEach((r) => {
        totalSunday++;
        if (r.is_present) {
          presentSunday++;
          presentByMember[r.member_id] = (presentByMember[r.member_id] || 0) + 1;
        }
      });

      setNewcomers(newcomerMembers.map((m) => ({ ...m, sundayPresent: presentByMember[m.id] || 0 })));
      setSundayRate(totalSunday > 0 ? Math.round((presentSunday / totalSunday) * 100) : 0);
      // Rétention : % de nouveaux revenus à au moins 2 cultes dominicaux
      const returned = ids.filter((id) => (presentByMember[id] || 0) >= 2).length;
      setRetention(ids.length > 0 ? Math.round((returned / ids.length) * 100) : 0);
    } finally {
      setLoading(false);
    }
  }, [start]);

  useEffect(() => { load(); }, [load]);

  async function promote(m: Newcomer) {
    setBusyId(m.id);
    const { error } = await supabase.from("members").update({ status: "member" }).eq("id", m.id);
    if (!error) {
      setNewcomers((prev) => prev.filter((x) => x.id !== m.id));
      setFlash(`${m.first_name} ${m.last_name} promu membre confirmé.`);
    }
    setBusyId(null);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);
    try {
      await registerNewcomer({ ...form, is_self_initiated: true });
      setShowAdd(false);
      setForm({ first_name: "", last_name: "", phone: "", residence_location: "", notes: "" });
      setFlash("Nouveau venu enregistré.");
      load();
    } catch (err: any) {
      setFlash(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const kpis = [
    { label: "Accueillis (période)", value: welcomedInPeriod, icon: "waving_hand", color: "from-[#3E8EED] to-[#2563eb]" },
    { label: "En intégration", value: newcomers.length, icon: "hourglass_top", color: "from-[#E8912F] to-[#D97B1E]" },
    { label: "Taux de retour", value: `${retention}%`, icon: "replay", color: "from-[#A16EFF] to-[#7c3aed]" },
    { label: "Présence dimanche", value: `${sundayRate}%`, icon: "church", color: "from-[#2E9E6B] to-[#059669]" },
  ];

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]";

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-28 font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#3E8EED] flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm">diversity_1</span>
              <span>MINISTÈRE D&apos;ACCUEIL · AMIS DES NOUVEAUX</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1E1B4B] tracking-tight">Bonjour, {firstName}</h1>
            <p className="text-sm text-[#6E6D79] font-medium mt-1">Accueillez et suivez l&apos;intégration des nouveaux venus.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all shrink-0 border border-[#fea619]/40">
            <span className="material-symbols-outlined text-[20px] text-[#fea619]">person_add</span>
            Enregistrer un nouveau
          </button>
        </div>

        {flash && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">✅ {flash}</div>}

        {/* Period selector */}
        <div className="glass-panel p-3 rounded-2xl shadow-sm flex items-center gap-2">
          <span className="text-xs font-bold text-[#6E6D79] uppercase tracking-wider mr-1">Période :</span>
          {([{ m: "day" as const, l: "Jour" }, { m: "week" as const, l: "Semaine" }, { m: "month" as const, l: "Mois" }]).map((p) => (
            <button key={p.m} onClick={() => applyMode(p.m)} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${mode === p.m ? "bg-[#3E8EED] text-white shadow-sm" : "bg-white/60 text-[#6E6D79] border border-slate-100 hover:bg-white"}`}>{p.l}</button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="card-luxe p-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center shadow-md mb-3`}>
                <span className="material-symbols-outlined">{k.icon}</span>
              </div>
              <div className="text-3xl font-black text-[#1E1B4B]">{loading ? "…" : k.value}</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Newcomers list */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1E1B4B]">Nouveaux à intégrer</h3>
            <span className="text-xs font-bold text-slate-400">{newcomers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5 min-w-[160px]">Nom</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Résidence</th>
                  <th className="py-3 px-4 text-center">Cultes suivis</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <tr><td colSpan={5} className="py-10 text-center text-slate-400 font-medium">Chargement…</td></tr>}
                {!loading && newcomers.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-400 font-medium">Aucun nouveau en intégration. 🎉</td></tr>}
                {!loading && newcomers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-bold text-slate-800">{m.first_name} {m.last_name}</td>
                    <td className="py-3 px-4 text-slate-600">{m.phone || "—"}</td>
                    <td className="py-3 px-4 text-slate-600">{m.residence_location || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${m.sundayPresent >= 2 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{m.sundayPresent}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => promote(m)} disabled={busyId === m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors disabled:opacity-40">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Promouvoir membre
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <h2 className="text-xl font-black text-[#1e1b4b] mb-5">Enregistrer un nouveau venu</h2>
        <form onSubmit={submitAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
            <input required placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
          </div>
          <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          <input placeholder="Résidence / quartier" value={form.residence_location} onChange={(e) => setForm({ ...form, residence_location: e.target.value })} className={inputCls} />
          <textarea placeholder="Notes (facultatif)" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] shadow-md transition-all disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

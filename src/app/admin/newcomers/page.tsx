"use client";

import { useEffect, useMemo, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import Pagination from "@/components/common/Pagination";

interface NewcomerRegistration {
  id: string;
  member_id: string;
  registration_date: string;
  invited_by_member_id: string | null;
  residence_location: string | null;
  is_self_initiated: boolean;
  assigned_shepherd_id: string | null;
  notes: string | null;
  member?: {
    first_name: string;
    last_name: string;
    phone: string | null;
    status: string;
    consecutive_sundays_present: number;
  } | null;
  registered_by_profile?: {
    first_name: string;
    last_name: string;
  } | null;
  invited_by?: {
    first_name: string;
    last_name: string;
  } | null;
  assigned_shepherd?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function NewcomersPage() {
  const [registrations, setRegistrations] = useState<NewcomerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [shepherds, setShepherds] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const filteredRegs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter((r) => `${r.member?.first_name || ""} ${r.member?.last_name || ""} ${r.member?.phone || ""}`.toLowerCase().includes(q));
  }, [registrations, search]);
  useEffect(() => { setPage(1); }, [search]);
  const pagedRegs = filteredRegs.slice((page - 1) * pageSize, page * pageSize);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    residence_location: "",
    invited_by_member_id: "",
    assigned_shepherd_id: "",
    notes: "",
    is_self_initiated: false,
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: regs } = await supabase
        .from("newcomer_registrations")
        .select(`
          *,
          member:members(first_name, last_name, phone, status, consecutive_sundays_present),
          registered_by_profile:profiles!newcomer_registrations_registered_by_fkey(first_name, last_name),
          invited_by:members!newcomer_registrations_invited_by_member_id_fkey(first_name, last_name),
          assigned_shepherd:profiles!newcomer_registrations_assigned_shepherd_id_fkey(first_name, last_name)
        `)
        .order("registration_date", { ascending: false });

      setRegistrations(regs || []);

      const { data: mems } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .is("archived_at", null)
        .order("first_name");

      setAllMembers(mems || []);

      const { data: sheps } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "shepherd");

      setShepherds(sheps || []);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data: member, error } = await supabase.rpc("register_newcomer" as any, {
        p_first_name: form.first_name,
        p_last_name: form.last_name,
        p_phone: form.phone || null,
        p_residence_location: form.residence_location || null,
        p_invited_by_member_id: form.invited_by_member_id || null,
        p_notes: form.notes || null,
        p_assigned_shepherd_id: form.assigned_shepherd_id || null,
        p_is_self_initiated: form.is_self_initiated,
      }).single();

      if (error) throw error;

      setMessage("Nouveau converti enregistré avec succès !");
      setShowForm(false);
      setForm({
        first_name: "",
        last_name: "",
        phone: "",
        residence_location: "",
        invited_by_member_id: "",
        assigned_shepherd_id: "",
        notes: "",
        is_self_initiated: false,
      });
      loadData();
    } catch (err: any) {
      // Fallback: try direct insert if RPC doesn't exist
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non authentifié");

        let shepherdId = form.assigned_shepherd_id || null;

        if (form.invited_by_member_id && !shepherdId) {
          const { data: inviter } = await supabase
            .from("members")
            .select("shepherd_id")
            .eq("id", form.invited_by_member_id)
            .single();
          if (inviter?.shepherd_id) shepherdId = inviter.shepherd_id;
        }

        const { data: member, error: memberError } = await supabase
          .from("members")
          .insert([{
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone || null,
            residence_location: form.residence_location || null,
            shepherd_id: shepherdId,
            invited_by_member_id: form.invited_by_member_id || null,
            status: "new",
            current_class: "none",
            consecutive_sundays_present: 1,
            consecutive_absences: 0,
          }])
          .select()
          .single();

        if (memberError) throw memberError;

        await supabase.from("newcomer_registrations").insert([{
          member_id: member.id,
          registered_by: user.id,
          registration_date: new Date().toISOString().split("T")[0],
          invited_by_member_id: form.invited_by_member_id || null,
          residence_location: form.residence_location || null,
          is_self_initiated: form.is_self_initiated,
          assigned_shepherd_id: shepherdId,
          notes: form.notes || null,
        }]);

        const { data: dept } = await supabase
          .from("departments")
          .select("id")
          .eq("name", "Amis des Nouveaux")
          .single();

        if (dept) {
          await supabase.from("member_departments").insert([{
            member_id: member.id,
            department_id: dept.id,
            role: "member",
          }]);
        }

        setMessage("Nouveau converti enregistré avec succès !");
        setShowForm(false);
        setForm({
          first_name: "",
          last_name: "",
          phone: "",
          residence_location: "",
          invited_by_member_id: "",
          assigned_shepherd_id: "",
          notes: "",
          is_self_initiated: false,
        });
        loadData();
      } catch (innerErr: any) {
        alert(`Erreur: ${innerErr.message}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoader label="Chargement des enregistrements..." />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-20 font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3 border border-[#fea619]/40 shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]">person_add</span>
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Amis des Nouveaux</span>
            </div>
            <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
              Enregistrement des Nouveaux
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-medium max-w-2xl">
              Accueillez et enregistrez les nouveaux venus chaque dimanche.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-4 rounded-2xl font-headline-md font-extrabold text-xs text-white bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-lg shadow-indigo-950/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2.5 cursor-pointer border border-[#fea619]/40"
          >
            <span className="material-symbols-outlined text-[20px] text-[#fea619]">person_add</span>
            Enregistrer un nouveau
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-2xs">
            <span>✓ {message}</span>
            <button onClick={() => setMessage(null)} className="text-emerald-700 font-black ml-4 hover:opacity-75">✕</button>
          </div>
        )}

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <div className="glass-panel rounded-3xl p-14 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#1e1b4b] mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <h3 className="text-base font-headline-md font-extrabold text-slate-900">
              Aucun enregistrement
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1.5 max-w-sm mx-auto">
              Commencez à enregistrer les nouveaux venus ce dimanche.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-headline-md font-extrabold text-[#1e1b4b]">
                Historique des enregistrements
                <span className="ml-2 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#1e1b4b]/10 text-[#1e1b4b]">{registrations.length}</span>
              </h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un nouveau…"
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#3E8EED] min-w-[200px]"
              />
            </div>
            <div className="divide-y divide-slate-100">
              {pagedRegs.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-slate-400 font-medium">Aucun résultat.</div>
              )}
              {pagedRegs.map((reg) => (
                <div key={reg.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {reg.member?.first_name[0]}{reg.member?.last_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1e1b4b]">
                          {reg.member?.first_name} {reg.member?.last_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{reg.member?.phone || "Pas de téléphone"}</span>
                          {reg.residence_location && <span>• {reg.residence_location}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-500">
                        {new Date(reg.registration_date).toLocaleDateString("fr-FR")}
                      </div>
                      {reg.is_self_initiated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                          Présenté de lui-même
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {reg.invited_by && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Invité par {reg.invited_by.first_name} {reg.invited_by.last_name}
                      </span>
                    )}
                    {reg.assigned_shepherd && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Berger: {reg.assigned_shepherd.first_name} {reg.assigned_shepherd.last_name}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full border ${
                      reg.member?.status === "member"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {reg.member?.status === "member" ? "Intégré" : `Intégration ${reg.member?.consecutive_sundays_present}/4`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination total={filteredRegs.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
          </div>
        )}

        {/* Registration Form Modal */}
        <Modal open={showForm} onClose={() => setShowForm(false)} maxWidth="max-w-2xl">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-[#fea619] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </div>
              <h2 className="text-xl font-headline-md font-extrabold text-[#1e1b4b]">Enregistrer un nouveau venu</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Nom *</label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20"
                    placeholder="+33 6 00 00 00 00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Lieu de résidence</label>
                  <input
                    type="text"
                    value={form.residence_location}
                    onChange={(e) => setForm({ ...form, residence_location: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Invité par</label>
                  <select
                    value={form.invited_by_member_id}
                    onChange={(e) => setForm({ ...form, invited_by_member_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 cursor-pointer"
                  >
                    <option value="">Aucun (présenté de lui-même)</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Berger assigné</label>
                  <select
                    value={form.assigned_shepherd_id}
                    onChange={(e) => setForm({ ...form, assigned_shepherd_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 cursor-pointer"
                  >
                    <option value="">Auto-assigner (via l'inviteur)</option>
                    {shepherds.map((s) => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20"
                  rows={2}
                  placeholder="Observations..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="self_initiated"
                  checked={form.is_self_initiated}
                  onChange={(e) => setForm({ ...form, is_self_initiated: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#1e1b4b] focus:ring-[#1e1b4b]"
                />
                <label htmlFor="self_initiated" className="text-xs font-bold text-slate-700">
                  Ce fidèle s&apos;est présenté de lui-même (sans inviteur)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import { hasOwnScope } from "@/lib/auth/roles";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: "new" | "member" | "absent_to_relaunch";
  consecutive_absences: number;
  last_seen_date: string;
}

interface Visit {
  id: string;
  member_id: string;
  visit_date: string;
  reason: string;
  notes: string | null;
  accompanied_by_member_id: string | null;
  members?: { first_name: string; last_name: string };
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
  groups?: { name: string } | null;
}

export default function AlertsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alertMembers, setAlertMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [visitHistory, setVisitHistory] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Visit Modal State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split("T")[0],
    reason: "Relance après absence prolongée",
    notes: "",
    accompanied_by_member_id: "",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadAlertsAndVisits() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("*, groups!profiles_group_id_fkey(name)")
          .eq("id", user.id)
          .single();

        if (!prof) {
          router.push("/profile");
          return;
        }
        setProfile(prof as Profile);

        // Fetch all non-archived members for accompaniment dropdown
        const { data: allMems } = await supabase
          .from("members")
          .select("*")
          .is("archived_at", null)
          .neq("status", "archived")
          .order("first_name", { ascending: true });
        if (allMems) setAllMembers(allMems as Member[]);

        // Fetch active members with consecutive_absences >= 2 or absent_to_relaunch
        let query = supabase
          .from("members")
          .select("*")
          .is("archived_at", null)
          .neq("status", "archived")
          .or("consecutive_absences.gte.2,status.eq.absent_to_relaunch")
          .order("consecutive_absences", { ascending: false });

        let sIds: string[] = [];
        if (hasOwnScope(prof.role)) {
          query = query.eq("shepherd_id", user.id);
        } else if (prof.role === "leader") {
          const { data: grpShepherds } = await supabase
            .from("profiles")
            .select("id")
            .eq("group_id", prof.group_id);
          sIds = grpShepherds?.map((s) => s.id) || [];
          query = query.in("shepherd_id", sIds.length > 0 ? sIds : ["00000000-0000-0000-0000-000000000000"]);
        }

        const { data: alertsData } = await query;
        if (alertsData) setAlertMembers(alertsData as Member[]);

        // Fetch past visits
        let visitsQuery = supabase
          .from("member_visits")
          .select("*, members!member_visits_member_id_fkey(first_name, last_name)")
          .order("visit_date", { ascending: false })
          .limit(20);

        if (hasOwnScope(prof.role)) {
          visitsQuery = visitsQuery.eq("shepherd_id", user.id);
        } else if (prof.role === "leader" && sIds.length > 0) {
          visitsQuery = visitsQuery.in("shepherd_id", sIds);
        }

        const { data: visitsData } = await visitsQuery;
        if (visitsData) setVisitHistory(visitsData as Visit[]);
      } catch (err) {
        console.error("Erreur de chargement des alertes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlertsAndVisits();
  }, [router, supabase]);

  const handleOpenVisitModal = (member: Member) => {
    setSelectedMember(member);
    setVisitForm({
      visit_date: new Date().toISOString().split("T")[0],
      reason: `Relance après ${member.consecutive_absences} absences dominicales`,
      notes: "",
      accompanied_by_member_id: "",
    });
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        shepherd_id: profile.id,
        member_id: selectedMember.id,
        visit_date: visitForm.visit_date,
        reason: visitForm.reason,
        notes: visitForm.notes || null,
        accompanied_by_member_id: visitForm.accompanied_by_member_id || null,
      };

      const { data, error } = await supabase
        .from("member_visits")
        .insert([payload])
        .select("*, members!member_visits_member_id_fkey(first_name, last_name)")
        .single();

      if (error) throw error;

      setMessage(`Visite pastorale pour ${selectedMember.first_name} ${selectedMember.last_name} enregistrée ! L'alerte d'absence est automatiquement levée.`);
      
      // Remove member from alert list (since consecutive_absences was reset by trigger!)
      setAlertMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      if (data) setVisitHistory((prev) => [data as Visit, ...prev]);
      setSelectedMember(null);
    } catch (err: any) {
      console.error("Erreur enregistrement visite:", err);
      alert(`Erreur lors de l'enregistrement de la visite : ${err?.message || err?.details || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Chargement des alertes pastorales..." />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 pb-20 font-sans selection:bg-indigo-500 selection:text-white">

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in-up">
        {/* Header Section */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3.5 border border-[#fea619]/40 shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-[#fea619] animate-bounce">notification_important</span>
                <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Alertes & Suivi d&apos;Urgence</span>
              </div>
              <h1 className="font-headline-md font-black text-2xl sm:text-3xl lg:text-4xl text-[#1e1b4b] tracking-tight flex items-center gap-3">
                <span>Fidèles en Absence Prolongée</span>
                <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 animate-pulse">
                  {alertMembers.length}
                </span>
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium max-w-2xl leading-relaxed">
                Ces fidèles se sont absentés 2 dimanches consécutifs ou plus. Effectuez une visite, un appel de réconfort ou une relance, et enregistrez le motif pour lever l&apos;alerte automatiquement en base.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className="glass-panel p-4 bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-sm font-black flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fadeIn rounded-2xl">
            <span className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping shrink-0" />
              <span>✓ {message}</span>
            </span>
            <button onClick={() => setMessage(null)} className="text-emerald-800 font-black ml-4 hover:opacity-75 p-1 rounded-lg hover:bg-emerald-100 transition-colors">✕</button>
          </div>
        )}

        {/* Alert Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
            <h2 className="text-lg font-black text-[#1e1b4b] flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-rose-500/40 animate-pulse" />
              <span>Alertes Actives à Traiter</span>
            </h2>
            <span className="text-xs font-black px-3.5 py-1 rounded-full bg-rose-50/90 text-rose-800 border border-rose-200/80 shadow-2xs">
              {alertMembers.length} âme{alertMembers.length > 1 ? "s" : ""} en attente
            </span>
          </div>

          {alertMembers.length === 0 ? (
            <div className="glass-panel p-12 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-md shadow-emerald-500/10">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1e1b4b]">Gloire à Dieu ! Aucune alerte d&apos;absence</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Tous vos fidèles sont réguliers aux cultes dominicaux ou ont déjà été pris en charge. Continuez ce merveilleux travail de veille spirituelle !
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {alertMembers.map((member) => (
                <div
                  key={member.id}
                  className="glass-panel-interactive border-rose-200/80 hover:border-rose-400 p-6 flex flex-col justify-between group relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-500/10 to-amber-500/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none transition-transform group-hover:scale-125 duration-500" />
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base font-black text-[#1e1b4b] flex items-center gap-2 group-hover:text-rose-700 transition-colors">
                          <span>{member.first_name} {member.last_name}</span>
                        </h3>
                        {member.phone ? (
                          <a href={`tel:${member.phone}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center gap-1 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">call</span>
                            <span>{member.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 mt-1 block italic">Aucun téléphone renseigné</span>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100/90 text-rose-800 border border-rose-300/80 shadow-2xs shrink-0">
                        {member.consecutive_absences} dimanches abs.
                      </span>
                    </div>

                    <div className="my-4 py-3.5 border-y border-slate-200/60 text-xs space-y-2.5 text-slate-600 font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Statut spirituel :</span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200/80">
                          {member.status === "absent_to_relaunch" ? "À relancer" : member.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Dernière présence :</span>
                        <span className="text-[#1e1b4b] font-bold">
                          {member.last_seen_date ? new Date(member.last_seen_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Inconnue"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenVisitModal(member)}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-rose-600 via-red-600 to-[#1e1b4b] hover:from-rose-700 hover:to-[#312e81] shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all transform group-hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-white/20 mt-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">handshake</span>
                    <span>Enregistrer Visite / Relance</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Pastoral Visits Log */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
            <h2 className="text-lg font-black text-[#1e1b4b] flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#1e1b4b] to-[#fea619] shadow-md shadow-indigo-500/40" />
              <span>Historique Récent des Visites Pastorales</span>
            </h2>
            <span className="text-xs font-black px-3.5 py-1 rounded-full bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              {visitHistory.length} visite{visitHistory.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="glass-panel p-6 sm:p-8 overflow-x-auto rounded-3xl">
            {visitHistory.length === 0 ? (
              <div className="text-center py-10 space-y-2.5">
                <span className="material-symbols-outlined text-4xl text-slate-300">history_toggle_off</span>
                <p className="text-xs font-semibold text-slate-500">Aucune visite pastorale enregistrée pour le moment.</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-slate-200/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-400 uppercase tracking-wider font-extrabold text-[11px] bg-slate-50/50">
                      <th className="pb-3.5 pt-3.5 px-4 font-black text-[#1e1b4b]">Date</th>
                      <th className="pb-3.5 pt-3.5 px-4 font-black text-[#1e1b4b]">Fidèle visité</th>
                      <th className="pb-3.5 pt-3.5 px-4 font-black text-[#1e1b4b]">Motif / Raison</th>
                      <th className="pb-3.5 pt-3.5 px-4 font-black text-[#1e1b4b]">Notes spirituelles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 font-medium">
                    {visitHistory.map((visit) => (
                      <tr key={visit.id} className="hover:bg-slate-50/80 even:bg-slate-50/60 transition-colors group">
                        <td className="py-4 px-4 font-bold text-slate-600 whitespace-nowrap first:rounded-l-2xl">
                          {new Date(visit.visit_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-4 px-4 font-black text-[#1e1b4b] whitespace-nowrap group-hover:text-indigo-600 transition-colors">
                          {visit.members ? `${visit.members.first_name} ${visit.members.last_name}` : "Fidèle"}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs whitespace-nowrap inline-block">
                            {visit.reason}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-md font-medium leading-relaxed last:rounded-r-2xl">
                          {visit.notes ? (
                            <span className="line-clamp-2">{visit.notes}</span>
                          ) : (
                            <span className="text-slate-400 italic">Aucune note spirituelle</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal for logging a visit */}
        <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)}>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black uppercase tracking-wider mb-2 border border-rose-200/80 shadow-2xs">
                  <span className="material-symbols-outlined text-[14px]">volunteer_activism</span>
                  <span>Relance & Suivi Pastoral</span>
                </div>
                <h2 className="text-xl font-black text-[#1e1b4b]">Enregistrer une Visite Pastorale</h2>
                <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                  Pour : <strong className="text-[#1e1b4b] font-black">{selectedMember.first_name} {selectedMember.last_name}</strong>. Cette action remettra à 0 le compteur d&apos;absences et réactivera le statut de l&apos;âme.
                </p>
              </div>

              <form onSubmit={handleSaveVisit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Date de la visite / de l&apos;appel
                  </label>
                  <input
                    type="date"
                    required
                    value={visitForm.visit_date}
                    onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold text-[#1e1b4b] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1e1b4b]/10 focus:border-[#1e1b4b] shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Motif de la visite / de l&apos;appel
                  </label>
                  <select
                    value={visitForm.reason}
                    onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold text-[#1e1b4b] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1e1b4b]/10 focus:border-[#1e1b4b] shadow-2xs transition-all"
                  >
                    <option value="Relance après absence prolongée">Relance après absence prolongée</option>
                    <option value="Soutien spirituel / Prière">Soutien spirituel / Prière</option>
                    <option value="Visite de courtoisie / Fraternelle">Visite de courtoisie / Fraternelle</option>
                    <option value="Soutien dans l'épreuve / Maladie">Soutien dans l&apos;épreuve / Maladie</option>
                    <option value="Autre motif pastoral">Autre motif pastoral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Notes et bilan spirituel (Optionnel)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Résultat de l'entretien, sujet de prière, disposition du cœur du fidèle..."
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-medium text-[#1e1b4b] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1e1b4b]/10 focus:border-[#1e1b4b] shadow-2xs transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Accompagné(e) par un autre membre ? (Optionnel)
                  </label>
                  <select
                    value={visitForm.accompanied_by_member_id}
                    onChange={(e) => setVisitForm({ ...visitForm, accompanied_by_member_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold text-[#1e1b4b] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1e1b4b]/10 focus:border-[#1e1b4b] shadow-2xs transition-all"
                  >
                    <option value="">Visite effectuée seul(e)</option>
                    {allMembers
                      .filter((m) => m.id !== selectedMember.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-rose-600 via-red-600 to-[#1e1b4b] hover:from-rose-700 hover:to-[#312e81] shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    {saving ? "Validation en cours..." : "✔ Valider et lever l'alerte"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}

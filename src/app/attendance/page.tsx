"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { formatWeekInterval } from "@/lib/utils/dateFormatter";
import WeekSelector from "@/components/common/WeekSelector";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: "new" | "member" | "absent_to_relaunch";
  current_class: "none" | "tuesday_class" | "wednesday_class" | "completed";
  consecutive_sundays_present: number;
  consecutive_absences: number;
  archived_at?: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
  groups?: { name: string } | null;
}

type ProgramType = "tuesday_class" | "wednesday_class" | "thursday_online" | "friday_service" | "sunday_service";

export default function AttendancePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Program selection & Date
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>("sunday_service");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // View state machine: start -> wizard -> summary
  const [viewMode, setViewMode] = useState<"start" | "wizard" | "summary">("start");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Attendance state: member_id -> boolean
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  // Absence reason state for Sunday: member_id -> reason
  const [absenceReasons, setAbsenceReasons] = useState<Record<string, string>>({});

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
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

        // Fetch members for this user/group
        let query = supabase.from("members").select("*").is("archived_at", null).neq("status", "archived").order("first_name", { ascending: true });
        if (prof.role === "shepherd") {
          query = query.eq("shepherd_id", user.id);
        } else if (prof.role === "leader") {
          const { data: grpShepherds } = await supabase
            .from("profiles")
            .select("id")
            .eq("group_id", prof.group_id);
          const sIds = grpShepherds?.map((s) => s.id) || [];
          query = query.in("shepherd_id", sIds.length > 0 ? sIds : ["00000000-0000-0000-0000-000000000000"]);
        }

        const { data: mems } = await query;
        if (mems) setMembers(mems as Member[]);
      } catch (err) {
        console.error("Erreur de chargement des présences:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  // Fetch existing attendance for selected date and program
  useEffect(() => {
    async function loadAttendance() {
      if (!profile || members.length === 0) return;
      try {
        const { data: existingAtt } = await supabase
          .from("attendance")
          .select("member_id, is_present")
          .eq("date", selectedDate)
          .eq("program_type", selectedProgram);

        const newAttState: Record<string, boolean> = {};
        existingAtt?.forEach((rec) => {
          newAttState[rec.member_id] = rec.is_present;
        });
        setAttendanceState(newAttState);

        if (selectedProgram === "sunday_service") {
          const { data: existingAbs } = await supabase
            .from("sunday_absences")
            .select("member_id, reason")
            .eq("date", selectedDate);
          
          const newReasons: Record<string, string> = {};
          existingAbs?.forEach((rec) => {
            newReasons[rec.member_id] = rec.reason;
          });
          setAbsenceReasons(newReasons);
        }
      } catch (err) {
        console.error("Erreur de chargement du détail de présence:", err);
      }
    }
    loadAttendance();
  }, [selectedDate, selectedProgram, profile, members, supabase]);

  // Reset view mode when date or program changes
  useEffect(() => {
    setViewMode("start");
    setMessage(null);
  }, [selectedDate, selectedProgram]);

  // Filter out archived members and match program rules
  const eligibleMembers = members.filter((m) => {
    if (m.archived_at) return false;
    if (selectedProgram === "tuesday_class") {
      return m.current_class === "tuesday_class";
    }
    if (selectedProgram === "wednesday_class") {
      return m.current_class === "wednesday_class";
    }
    return true; // Thursday online, Friday, Sunday show everyone
  });

  // Calculate 7-day lock
  const isLocked = (() => {
    if (profile?.role === "pastor") return false;
    const now = new Date();
    const sel = new Date(selectedDate + "T00:00:00");
    const diffTime = now.getTime() - sel.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays > 7;
  })();

  const advanceWizard = () => {
    if (currentIndex < eligibleMembers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setViewMode("summary");
    }
  };

  const handleWizardToggle = (memberId: string, present: boolean) => {
    setAttendanceState((prev) => ({
      ...prev,
      [memberId]: present,
    }));
    if (present || selectedProgram !== "sunday_service") {
      advanceWizard();
    }
  };

  const handleQuickToggle = (memberId: string, currentVal?: boolean) => {
    if (isLocked) return;
    setAttendanceState((prev) => ({
      ...prev,
      [memberId]: !currentVal,
    }));
  };

  const handleSelectAll = (present: boolean) => {
    if (isLocked) return;
    const nextState: Record<string, boolean> = { ...attendanceState };
    eligibleMembers.forEach((m) => {
      nextState[m.id] = present;
    });
    setAttendanceState(nextState);
  };

  const handleSaveAttendance = async () => {
    if (isLocked) return;
    setSaving(true);
    setMessage(null);
    try {
      const recordsToUpsert = eligibleMembers.map((m) => ({
        member_id: m.id,
        date: selectedDate,
        program_type: selectedProgram,
        is_present: !!attendanceState[m.id],
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(recordsToUpsert, { onConflict: "member_id,date,program_type" });

      if (error) throw error;

      if (selectedProgram === "sunday_service") {
        const absentees = eligibleMembers.filter((m) => !attendanceState[m.id]);
        const absRecords = absentees
          .filter((m) => absenceReasons[m.id]?.trim())
          .map((m) => ({
            member_id: m.id,
            date: selectedDate,
            reason: absenceReasons[m.id] || "Absence non justifiée",
          }));

        if (absRecords.length > 0) {
          await supabase
            .from("sunday_absences")
            .upsert(absRecords, { onConflict: "member_id,date" });
        }
      }

      setMessage("Présences enregistrées avec succès ! Les compteurs d'intégration et statuts ont été mis à jour.");
      
      const { data: updatedMems } = await supabase.from("members").select("*").is("archived_at", null).neq("status", "archived");
      if (updatedMems) {
        setMembers((prev) =>
          prev.map((m) => {
            const updated = updatedMems.find((um) => um.id === m.id);
            return updated ? (updated as Member) : m;
          })
        );
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      alert(`Erreur lors de l'enregistrement des présences : ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const programOptions: { id: ProgramType; label: string; desc: string; icon: string }[] = [
    { id: "sunday_service", label: "Dimanche (Culte)", desc: "Tout le monde convié • Déclenche la règle des 4 dimanches", icon: "🌞" },
    { id: "tuesday_class", label: "Mardi (Classe)", desc: "Réservé aux membres de la classe du mardi", icon: "📖" },
    { id: "wednesday_class", label: "Mercredi (Classe)", desc: "Réservé aux membres de la classe du mercredi", icon: "🕯️" },
    { id: "thursday_online", label: "Jeudi (En ligne)", desc: "Prière en ligne • Tout le monde convié", icon: "🌐" },
    { id: "friday_service", label: "Vendredi (Culte)", desc: "Culte / Veillée • Tout le monde convié", icon: "🔥" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-200 font-semibold text-sm">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement des listes de présence...</span>
        </div>
      </div>
    );
  }

  const activeMember = eligibleMembers[currentIndex] || eligibleMembers[0];
  const presentCount = eligibleMembers.filter((m) => attendanceState[m.id]).length;
  const absentCount = eligibleMembers.length - presentCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      <Navbar
        role={profile?.role || "shepherd"}
        groupName={profile?.groups?.name}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-2 border border-[#fea619]/30 shadow-2xs">
                <span className="material-symbols-outlined text-[15px] text-[#fea619]">event_available</span>
                <span className="font-label-caps font-bold text-[11px] uppercase tracking-wider">Pointage & Présences</span>
              </div>
              <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
                Pointage des Présences
              </h1>
              <p className="text-xs sm:text-sm text-[#47464f] mt-1 font-medium">
                Sélectionnez le culte ou la classe, vérifiez les fidèles convoqués et enregistrez d&apos;un clic.
              </p>
            </div>

            <WeekSelector selectedDate={selectedDate} onChangeDate={setSelectedDate} />
          </div>

          {/* Program Type Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-200/80">
            {programOptions.map((prog) => {
              const isActive = selectedProgram === prog.id;
              return (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog.id)}
                  className={`p-4.5 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b] text-white shadow-xl shadow-indigo-950/30 scale-[1.03] border border-[#fea619]/50"
                      : "bg-white border border-slate-200/80 text-slate-700 hover:text-[#1e1b4b] hover:bg-slate-50 hover:border-indigo-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-100/10 backdrop-blur-md">{prog.icon}</span>
                    {isActive && <span className="w-2.5 h-2.5 rounded-full bg-[#fea619] shadow-md shadow-[#fea619]/50 animate-pulse" />}
                  </div>
                  <div>
                    <div className="font-black text-xs sm:text-sm tracking-tight">{prog.label}</div>
                    <div className={`text-[11px] mt-1 leading-tight font-medium line-clamp-2 ${isActive ? "text-indigo-200" : "text-slate-500"}`}>
                      {prog.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-black flex items-center justify-between shadow-md shadow-emerald-500/10 animate-fadeIn">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span>✓ {message}</span>
            </span>
            <button onClick={() => setMessage(null)} className="text-emerald-800 font-black ml-4 hover:opacity-75">✕</button>
          </div>
        )}

        {/* VIEW MODE: START */}
        {viewMode === "start" && (
          <div className="bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 border border-slate-200/80 rounded-3xl p-8 sm:p-14 text-center shadow-xl shadow-slate-200/50 space-y-7 relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-100 via-purple-50 to-amber-50 border border-indigo-200/60 flex items-center justify-center mx-auto text-indigo-700 shadow-lg shadow-indigo-500/10 transform hover:scale-105 transition-all">
              <span className="text-4xl">📋</span>
            </div>
            <div className="max-w-md mx-auto space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] tracking-tight">
                {programOptions.find((p) => p.id === selectedProgram)?.label}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
                {eligibleMembers.length === 0
                  ? "Aucun fidèle actif assigné à ce programme pour ce groupe."
                  : `${eligibleMembers.length} fidèle(s) actif(s) convié(s) pour le ${new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`}
              </p>
            </div>

            {isLocked ? (
              <div className="max-w-md mx-auto p-5 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3.5 shadow-md shadow-amber-500/10">
                <div className="flex items-center justify-center gap-2 font-black text-sm text-amber-800">
                  <span>🔒 Délai légal de 7 jours expiré</span>
                </div>
                <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                  Cette date dépasse le délai de 7 jours. La liste est en lecture seule pour préserver l&apos;intégrité de l&apos;historique pastoral.
                </p>
                <button
                  onClick={() => setViewMode("summary")}
                  className="w-full px-6 py-3.5 rounded-2xl font-black text-xs bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20"
                >
                  📋 Consulter le Rapport en Lecture Seule
                </button>
              </div>
            ) : (
              eligibleMembers.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                  <button
                    onClick={() => {
                      setCurrentIndex(0);
                      setViewMode("wizard");
                    }}
                    className="w-full sm:w-auto px-8 py-4.5 rounded-2xl font-black text-sm text-[#1e1b4b] bg-gradient-to-r from-[#fea619] via-[#ffb947] to-[#fea619] hover:from-amber-400 hover:to-amber-400 shadow-xl shadow-[#fea619]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <span>🚀 Démarrer l&apos;appel pas-à-pas ({eligibleMembers.length} conviés)</span>
                  </button>
                  <button
                    onClick={() => setViewMode("summary")}
                    className="w-full sm:w-auto px-7 py-4.5 rounded-2xl font-black text-xs text-slate-700 bg-white hover:bg-slate-50 transition-all border border-slate-200 shadow-md shadow-slate-200/50 flex items-center justify-center gap-2"
                  >
                    <span>📋 Voir la grille globale récapitulative</span>
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* VIEW MODE: WIZARD */}
        {viewMode === "wizard" && activeMember && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/10 space-y-8 animate-fadeIn relative overflow-hidden">
            {/* Wizard Header Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
                  }}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  ← Précédent
                </button>
                <div className="text-xs sm:text-sm font-black text-slate-700 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/60">
                  Fidèle <span className="text-[#1e1b4b] font-extrabold">{currentIndex + 1}</span> sur {eligibleMembers.length}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 max-w-xs hidden md:block bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                <div
                  className="bg-gradient-to-r from-[#1e1b4b] via-[#2d2a6e] to-[#fea619] h-full transition-all duration-500 rounded-full shadow-sm"
                  style={{ width: `${((currentIndex + 1) / eligibleMembers.length) * 100}%` }}
                />
              </div>

              <button
                onClick={() => setViewMode("start")}
                className="px-4 py-2.5 rounded-2xl text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors shadow-2xs"
              >
                ✕ Quitter l&apos;appel
              </button>
            </div>

            {/* Active Member Big Card */}
            <div className="text-center py-8 px-4 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1e1b4b] via-[#2d2a6e] to-[#4338ca] text-white text-3xl font-black shadow-xl shadow-indigo-950/20 mb-2 border border-[#fea619]/40 transform hover:rotate-3 transition-transform">
                {activeMember.first_name[0]}{activeMember.last_name[0]}
              </div>

              <div>
                <h3 className="text-3xl sm:text-5xl font-extrabold text-[#1e1b4b] tracking-tight">
                  {activeMember.first_name} {activeMember.last_name}
                </h3>
                <div className="flex items-center justify-center gap-2.5 flex-wrap mt-4">
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                    📞 {activeMember.phone || "Pas de téléphone renseigné"}
                  </span>
                  {activeMember.status === "new" && (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs flex items-center gap-1.5">
                      <span>✨ Nouveau</span>
                      <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[10px]">{activeMember.consecutive_sundays_present}/4</span>
                    </span>
                  )}
                  {activeMember.status === "absent_to_relaunch" && (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse shadow-2xs">
                      ⚠️ À relancer prioritairement
                    </span>
                  )}
                </div>
              </div>

              {/* Huge Action Buttons */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6">
                <button
                  onClick={() => handleWizardToggle(activeMember.id, true)}
                  className={`py-7 sm:py-9 rounded-3xl font-black text-lg sm:text-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
                    attendanceState[activeMember.id] === true
                      ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white ring-4 ring-emerald-300/80 scale-105 shadow-emerald-600/40"
                      : "bg-emerald-50/80 text-emerald-900 hover:bg-emerald-600 hover:text-white border border-emerald-300/80 shadow-emerald-500/10"
                  }`}
                >
                  <span className="text-4xl sm:text-5xl drop-shadow-sm">✓</span>
                  <span className="tracking-wide font-headline-md">PRÉSENT(E)</span>
                </button>

                <button
                  onClick={() => handleWizardToggle(activeMember.id, false)}
                  className={`py-7 sm:py-9 rounded-3xl font-black text-lg sm:text-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
                    attendanceState[activeMember.id] === false
                      ? "bg-gradient-to-br from-rose-600 to-red-700 text-white ring-4 ring-rose-300/80 scale-105 shadow-rose-600/40"
                      : "bg-rose-50/80 text-rose-900 hover:bg-rose-600 hover:text-white border border-rose-300/80 shadow-rose-500/10"
                  }`}
                >
                  <span className="text-4xl sm:text-5xl drop-shadow-sm">✕</span>
                  <span className="tracking-wide font-headline-md">ABSENT(E)</span>
                </button>
              </div>

              {/* If Sunday service and marked Absent -> Show Absence Reason prompt */}
              {selectedProgram === "sunday_service" && attendanceState[activeMember.id] === false && (
                <div className="mt-8 p-6 rounded-3xl bg-rose-50/80 border border-rose-200 text-left space-y-4 animate-fadeIn shadow-md">
                  <label className="block text-xs font-black text-rose-950 uppercase tracking-wider">
                    📝 Motif ou raison de l&apos;absence :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Maladie", "Voyage", "Travail", "Imprévu familial", "Non joignable"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setAbsenceReasons({ ...absenceReasons, [activeMember.id]: chip })}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-900 border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Saisissez ou choisissez un motif d'absence..."
                      value={absenceReasons[activeMember.id] || ""}
                      onChange={(e) => setAbsenceReasons({ ...absenceReasons, [activeMember.id]: e.target.value })}
                      className="flex-1 px-4 py-3.5 rounded-2xl bg-white border border-rose-300 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={advanceWizard}
                      className="px-7 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 transition-all shadow-md shadow-rose-500/20"
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE: SUMMARY */}
        {viewMode === "summary" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/10 space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e1b4b] flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 text-lg">📊</span>
                  <span>Grille Récapitulative des Présences</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold">
                  {isLocked
                    ? "Rapport en lecture seule due à l'expiration du délai légal de 7 jours."
                    : "Vérifiez vos saisies et apportez des ajustements individuels avant l'enregistrement définitif."}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>✓ Présents: {presentCount} ({eligibleMembers.length > 0 ? Math.round((presentCount / eligibleMembers.length) * 100) : 0}%)</span>
                </span>
                <span className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-black shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>✕ Absents: {absentCount}</span>
                </span>
              </div>
            </div>

            {/* Quick bulk controls */}
            {!isLocked && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold">
                <span className="text-slate-700 font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-indigo-600">bolt</span>
                  <span>Basculer toute la liste en un clic :</span>
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200 font-black transition-colors shadow-2xs"
                  >
                    ✓ Tous Présents
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="px-4 py-2 rounded-xl bg-rose-100/80 text-rose-900 hover:bg-rose-200 font-black transition-colors shadow-2xs"
                  >
                    ✕ Tous Absents
                  </button>
                </div>
              </div>
            )}

            {/* 2 Columns: Presents & Absents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Presents Column */}
              <div className="space-y-3.5">
                <h3 className="font-black text-sm uppercase tracking-wider text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>✓ Fidèles Présents</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-xs font-extrabold">{presentCount}</span>
                </h3>
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {eligibleMembers
                    .filter((m) => attendanceState[m.id] === true)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 flex items-center justify-between gap-3 shadow-2xs hover:bg-emerald-50/80 transition-all duration-200"
                      >
                        <div>
                          <div className="font-black text-sm text-slate-900">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">{member.phone || "Pas de téléphone"}</div>
                        </div>
                        {!isLocked && (
                          <button
                            onClick={() => handleQuickToggle(member.id, true)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors shadow-2xs"
                          >
                            Basculer Absent
                          </button>
                        )}
                      </div>
                    ))}
                  {presentCount === 0 && (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold bg-slate-50/50">
                      Aucun fidèle marqué présent.
                    </div>
                  )}
                </div>
              </div>

              {/* Absents Column */}
              <div className="space-y-3.5">
                <h3 className="font-black text-sm uppercase tracking-wider text-rose-900 bg-rose-50/90 border border-rose-200/80 p-3.5 rounded-2xl flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>✕ Fidèles Absents</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-200/70 text-rose-900 text-xs font-extrabold">{absentCount}</span>
                </h3>
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {eligibleMembers
                    .filter((m) => attendanceState[m.id] !== true)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40 flex flex-col gap-2.5 shadow-2xs hover:bg-rose-50/80 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-black text-sm text-slate-900">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">{member.phone || "Pas de téléphone"}</div>
                          </div>
                          {!isLocked && (
                            <button
                              onClick={() => handleQuickToggle(member.id, false)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-2xs"
                            >
                              Basculer Présent
                            </button>
                          )}
                        </div>

                        {selectedProgram === "sunday_service" && (
                          <div className="mt-1 pt-2.5 border-t border-rose-200/60 flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-900">Motif :</span>
                            {isLocked ? (
                              <span className="text-xs font-bold text-rose-950 bg-rose-100/80 px-2.5 py-1 rounded-lg">
                                {absenceReasons[member.id] || "Absence non justifiée"}
                              </span>
                            ) : (
                              <input
                                type="text"
                                placeholder="Motif de l'absence..."
                                value={absenceReasons[member.id] || ""}
                                onChange={(e) => setAbsenceReasons({ ...absenceReasons, [member.id]: e.target.value })}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  {absentCount === 0 && (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold bg-slate-50/50">
                      Aucun fidèle marqué absent.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setViewMode("wizard");
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 shadow-2xs"
              >
                ← Recommencer l&apos;appel pas-à-pas
              </button>

              {isLocked ? (
                <div className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-2 shadow-sm">
                  <span>🔒 L&apos;enregistrement est désactivé (Délai légal de 7 jours expiré)</span>
                </div>
              ) : (
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving || eligibleMembers.length === 0}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-[#1e1b4b] bg-gradient-to-r from-[#fea619] via-[#ffb947] to-[#fea619] hover:from-amber-400 hover:to-amber-400 shadow-xl shadow-[#fea619]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? "Enregistrement en cours..." : "💾 Valider & Enregistrer l'appel"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

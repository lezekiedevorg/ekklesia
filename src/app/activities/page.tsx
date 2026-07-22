"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatWeekInterval } from "@/lib/utils/dateFormatter";
import WeekSelector from "@/components/common/WeekSelector";

interface ShepherdActivity {
  id: string;
  shepherd_id: string;
  week_start_date: string;
  daily_prayer_done?: boolean;
  prayer_i_done?: boolean;
  fasting_q_done?: boolean;
  fasting_i_done?: boolean;
  daily_meditation_done?: boolean;
  meditation_i_done?: boolean;
  word_listening_q_done?: boolean;
  word_listening_i_done?: boolean;
  meditated_book?: string | null;
  evangelization_done: boolean;
  mentoring_done?: boolean;
  visits_done?: boolean;
  phone_calls_done?: boolean;
  phone_calls_count?: number;
  personal_invites_count?: number;
  group_invites_count?: number;
  recovered_souls_count?: number;
  message_listeners_count?: number;
  shepherd_attendance_tuesday?: boolean;
  shepherd_attendance_wednesday?: boolean;
  shepherd_attendance_thursday?: boolean;
  shepherd_attendance_friday?: boolean;
  shepherd_attendance_sunday?: boolean;
  monthly_pre_service_intercession?: boolean;
  monthly_in_person_prayer_done: boolean;
  monthly_anagkazo?: boolean;
  monthly_group_evangelization?: boolean;
  monthly_prayer_vigil_done: boolean;
  prayer_chain_done?: boolean;
  mentoring_theme?: string | null;
  other_observations?: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
  groups?: { name: string } | null;
}

export default function ActivitiesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<ShepherdActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Top-level tabs to prevent overflow scroll bugs and reduce visual clutter
  const [mainTab, setMainTab] = useState<"form" | "history">("form");

  // Helper to get Monday of current week
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  };

  const [selectedWeek, setSelectedWeek] = useState<string>(getMonday(new Date()));

  const [programsSummary, setProgramsSummary] = useState<{
    program_type: string;
    label: string;
    icon: string;
    present_count: number;
    eligible_count: number;
    ratio_pct: number;
  }[]>([]);

  // Form state
  const [form, setForm] = useState({
    // 1. Vie personnelle (Q/I mutual exclusion)
    daily_prayer_done: false, // Prière Q
    prayer_i_done: false,     // Prière I
    fasting_q_done: false,    // Jeûne Q
    fasting_i_done: false,    // Jeûne I
    daily_meditation_done: false, // Méditation Q
    meditation_i_done: false,     // Méditation I
    word_listening_q_done: false, // Ecoute parole Q
    word_listening_i_done: false, // Ecoute parole I
    meditated_book: "",

    // 2. Travail du berger
    evangelization_done: false,
    mentoring_done: false,
    visits_done: false,
    phone_calls_done: false,
    phone_calls_count: 0,
    personal_invites_count: 0,
    group_invites_count: 0,
    recovered_souls_count: 0,
    message_listeners_count: 0,

    // 3. Programme d'église
    shepherd_attendance_tuesday: false,
    shepherd_attendance_wednesday: false,
    shepherd_attendance_thursday: false,
    shepherd_attendance_friday: false,
    shepherd_attendance_sunday: false,

    // 4. Activités mensuelles
    monthly_pre_service_intercession: false,
    monthly_in_person_prayer_done: false,
    monthly_anagkazo: false,
    monthly_group_evangelization: false,
    monthly_prayer_vigil_done: false,

    // 5. Chaînes de prière
    prayer_chain_done: false,

    // 6. Observations & Thème
    mentoring_theme: "",
    other_observations: "",
  });

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

        // Fetch activity history
        let query = supabase.from("shepherd_activities").select("*").order("week_start_date", { ascending: false });
        if (prof.role === "shepherd") {
          query = query.eq("shepherd_id", user.id);
        }
        const { data: actData } = await query;
        if (actData) setActivities(actData as ShepherdActivity[]);
      } catch (err) {
        console.error("Erreur de chargement des activités:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  // When week or profile changes, populate form if activity already exists for that week
  useEffect(() => {
    if (!profile) return;
    const existing = activities.find(
      (a) => a.shepherd_id === profile.id && a.week_start_date === selectedWeek
    );
    if (existing) {
      setForm({
        daily_prayer_done: existing.daily_prayer_done ?? false,
        prayer_i_done: existing.prayer_i_done ?? false,
        fasting_q_done: existing.fasting_q_done ?? false,
        fasting_i_done: existing.fasting_i_done ?? false,
        daily_meditation_done: existing.daily_meditation_done ?? false,
        meditation_i_done: existing.meditation_i_done ?? false,
        word_listening_q_done: existing.word_listening_q_done ?? false,
        word_listening_i_done: existing.word_listening_i_done ?? false,
        meditated_book: existing.meditated_book || "",
        evangelization_done: existing.evangelization_done ?? false,
        mentoring_done: existing.mentoring_done ?? false,
        visits_done: existing.visits_done ?? false,
        phone_calls_done: existing.phone_calls_done ?? false,
        phone_calls_count: existing.phone_calls_count ?? 0,
        personal_invites_count: existing.personal_invites_count ?? 0,
        group_invites_count: existing.group_invites_count ?? 0,
        recovered_souls_count: existing.recovered_souls_count ?? 0,
        message_listeners_count: existing.message_listeners_count ?? 0,
        shepherd_attendance_tuesday: existing.shepherd_attendance_tuesday ?? false,
        shepherd_attendance_wednesday: existing.shepherd_attendance_wednesday ?? false,
        shepherd_attendance_thursday: existing.shepherd_attendance_thursday ?? false,
        shepherd_attendance_friday: existing.shepherd_attendance_friday ?? false,
        shepherd_attendance_sunday: existing.shepherd_attendance_sunday ?? false,
        monthly_pre_service_intercession: existing.monthly_pre_service_intercession ?? false,
        monthly_in_person_prayer_done: existing.monthly_in_person_prayer_done ?? false,
        monthly_anagkazo: existing.monthly_anagkazo ?? false,
        monthly_group_evangelization: existing.monthly_group_evangelization ?? false,
        monthly_prayer_vigil_done: existing.monthly_prayer_vigil_done ?? false,
        prayer_chain_done: existing.prayer_chain_done ?? false,
        mentoring_theme: existing.mentoring_theme || "",
        other_observations: existing.other_observations || "",
      });
    } else {
      setForm({
        daily_prayer_done: false,
        prayer_i_done: false,
        fasting_q_done: false,
        fasting_i_done: false,
        daily_meditation_done: false,
        meditation_i_done: false,
        word_listening_q_done: false,
        word_listening_i_done: false,
        meditated_book: "",
        evangelization_done: false,
        mentoring_done: false,
        visits_done: false,
        phone_calls_done: false,
        phone_calls_count: 0,
        personal_invites_count: 0,
        group_invites_count: 0,
        recovered_souls_count: 0,
        message_listeners_count: 0,
        shepherd_attendance_tuesday: false,
        shepherd_attendance_wednesday: false,
        shepherd_attendance_thursday: false,
        shepherd_attendance_friday: false,
        shepherd_attendance_sunday: false,
        monthly_pre_service_intercession: false,
        monthly_in_person_prayer_done: false,
        monthly_anagkazo: false,
        monthly_group_evangelization: false,
        monthly_prayer_vigil_done: false,
        prayer_chain_done: false,
        mentoring_theme: "",
        other_observations: "",
      });
    }
  }, [selectedWeek, profile, activities]);

  useEffect(() => {
    async function loadAttendanceSummary() {
      if (!profile || !selectedWeek) return;
      try {
        const mondayStr = selectedWeek;
        const mondayDate = new Date(mondayStr + "T00:00:00");
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        const sundayStr = sundayDate.toISOString().split("T")[0];

        let memQuery = supabase
          .from("members")
          .select("id, status, track")
          .is("archived_at", null)
          .neq("status", "archived");
        if (profile.role === "shepherd") {
          memQuery = memQuery.eq("shepherd_id", profile.id);
        }
        const { data: mems } = await memQuery;
        const memIds = mems?.map((m) => m.id) || [];

        const { data: attData } = memIds.length > 0
          ? await supabase
              .from("attendance")
              .select("member_id, program_type, is_present")
              .in("member_id", memIds)
              .gte("date", mondayStr)
              .lte("date", sundayStr)
          : { data: [] };

        const programDefinitions = [
          { id: "sunday_service", label: "Dimanche (Culte Dominical)", icon: "🌞" },
          { id: "tuesday_class", label: "Mardi (Classe d'affermissement)", icon: "📘" },
          { id: "wednesday_class", label: "Mercredi (Classe de fondements)", icon: "📗" },
          { id: "thursday_online", label: "Jeudi (Prière en ligne)", icon: "🌐" },
          { id: "friday_service", label: "Vendredi (Veillée / Culte)", icon: "🔥" },
        ];

        const summary = programDefinitions.map((prog) => {
          let eligibleMembers = mems || [];
          if (prog.id === "tuesday_class") {
            eligibleMembers = (mems || []).filter((m) => m.status === "member" && m.track === "tuesday_class");
          } else if (prog.id === "wednesday_class") {
            eligibleMembers = (mems || []).filter((m) => m.status === "member" && m.track === "wednesday_class");
          }
          const eligibleCount = eligibleMembers.length;

          const presentIdsForProg = new Set(
            (attData || [])
              .filter((a) => a.program_type === prog.id && a.is_present)
              .map((a) => a.member_id)
          );
          const presentCount = presentIdsForProg.size;
          const ratio = eligibleCount > 0 ? Math.round((presentCount / eligibleCount) * 100) : 0;

          return {
            program_type: prog.id,
            label: prog.label,
            icon: prog.icon,
            present_count: presentCount,
            eligible_count: eligibleCount,
            ratio_pct: ratio,
          };
        });

        setProgramsSummary(summary);
      } catch (e) {
        console.error("Erreur calcul présence programmes:", e);
      }
    }
    loadAttendanceSummary();
  }, [selectedWeek, profile, supabase]);

  // Helper for strictly mutually exclusive Q/I choice
  const selectQI = (qField: keyof typeof form, iField: keyof typeof form, choice: "Q" | "I" | "NONE") => {
    if (choice === "Q") {
      const isAlreadyQ = Boolean(form[qField]);
      setForm((prev) => ({
        ...prev,
        [qField]: !isAlreadyQ,
        [iField]: false,
      }));
    } else if (choice === "I") {
      const isAlreadyI = Boolean(form[iField]);
      setForm((prev) => ({
        ...prev,
        [iField]: !isAlreadyI,
        [qField]: false,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [qField]: false,
        [iField]: false,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        shepherd_id: profile.id,
        week_start_date: selectedWeek,
        daily_prayer_done: form.daily_prayer_done,
        prayer_i_done: form.prayer_i_done,
        fasting_q_done: form.fasting_q_done,
        fasting_i_done: form.fasting_i_done,
        daily_meditation_done: form.daily_meditation_done,
        meditation_i_done: form.meditation_i_done,
        word_listening_q_done: form.word_listening_q_done,
        word_listening_i_done: form.word_listening_i_done,
        meditated_book: form.meditated_book || null,
        evangelization_done: form.evangelization_done,
        mentoring_done: form.mentoring_done,
        visits_done: form.visits_done,
        phone_calls_done: form.phone_calls_done,
        phone_calls_count: Number(form.phone_calls_count) || 0,
        personal_invites_count: Number(form.personal_invites_count) || 0,
        group_invites_count: Number(form.group_invites_count) || 0,
        recovered_souls_count: Number(form.recovered_souls_count) || 0,
        message_listeners_count: Number(form.message_listeners_count) || 0,
        shepherd_attendance_tuesday: form.shepherd_attendance_tuesday,
        shepherd_attendance_wednesday: form.shepherd_attendance_wednesday,
        shepherd_attendance_thursday: form.shepherd_attendance_thursday,
        shepherd_attendance_friday: form.shepherd_attendance_friday,
        shepherd_attendance_sunday: form.shepherd_attendance_sunday,
        monthly_pre_service_intercession: form.monthly_pre_service_intercession,
        monthly_in_person_prayer_done: form.monthly_in_person_prayer_done,
        monthly_anagkazo: form.monthly_anagkazo,
        monthly_group_evangelization: form.monthly_group_evangelization,
        monthly_prayer_vigil_done: form.monthly_prayer_vigil_done,
        prayer_chain_done: form.prayer_chain_done,
        mentoring_theme: form.mentoring_theme || null,
        other_observations: form.other_observations || null,
      };

      const { data, error } = await supabase
        .from("shepherd_activities")
        .upsert([payload], { onConflict: "shepherd_id,week_start_date" })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setActivities((prev) => {
          const filtered = prev.filter((a) => !(a.shepherd_id === profile.id && a.week_start_date === selectedWeek));
          return [data as ShepherdActivity, ...filtered];
        });
        setMessage("Discipline spirituelle et consécration enregistrées avec succès !");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      alert(`Erreur lors de l'enregistrement des activités : ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-200 font-semibold text-sm">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement de la discipline et consécration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      <Navbar
        role={profile?.role || "shepherd"}
        groupName={profile?.groups?.name}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-2.5 border border-[#fea619]/40 shadow-2xs">
                <span className="material-symbols-outlined text-[15px] text-[#fea619]">self_improvement</span>
                <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Discipline & Consécration</span>
              </div>
              <h1 className="font-headline-md font-black text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
                Suivi Spirituel du Berger
              </h1>
              <p className="text-[#47464f] text-xs sm:text-sm mt-1.5 font-medium max-w-2xl leading-relaxed">
                Remplissez quotidiennement et hebdomadairement vos disciplines (Q = Quotidien 7/7j, I = Intermittent, mutuellement exclusifs), vos actions pastorales et vos présences.
              </p>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 self-start md:self-center">
              <button
                type="button"
                onClick={() => setMainTab("form")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  mainTab === "form"
                    ? "bg-[#1e1b4b] text-[#fea619] shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <span>📝 Saisie de la Semaine</span>
              </button>
              <button
                type="button"
                onClick={() => setMainTab("history")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  mainTab === "history"
                    ? "bg-[#1e1b4b] text-[#fea619] shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <span>📜 Historique</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  mainTab === "history" ? "bg-[#fea619] text-[#1e1b4b]" : "bg-slate-300 text-slate-700"
                }`}>
                  {activities.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2">
              <span className="text-base">🎉</span>
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-emerald-700 font-black hover:opacity-75">✕</button>
          </div>
        )}

        {/* TAB 1: FORM VIEW (Compact 2-Column Responsive Layout) */}
        {mainTab === "form" && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Week Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/40">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#fea619]" />
                <span className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider">
                  Semaine active : <span className="text-indigo-600 font-extrabold">{formatWeekInterval(selectedWeek)}</span>
                </span>
              </div>
              <WeekSelector
                selectedDate={selectedWeek}
                onChangeDate={(w) => setSelectedWeek(w)}
              />
            </div>

            {/* 2-Column Grid structure to prevent long page scrolling */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN (6 cols): Vie Personnelle & Activités Mensuelles */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 1. VIE PERSONNELLE (Q/I mutuellement exclusifs) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                      <span>🙏</span> 1. Vie Personnelle (Q / I)
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">Mutuellement Exclusifs</span>
                  </div>

                  <div className="space-y-3">
                    {/* Prière */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="font-extrabold text-xs text-[#1e1b4b] flex items-center gap-2">
                        <span>🔥</span> Prière Quotidienne
                      </span>
                      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/50">
                        <button
                          type="button"
                          onClick={() => selectQI("daily_prayer_done", "prayer_i_done", "NONE")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                            !form.daily_prayer_done && !form.prayer_i_done
                              ? "bg-white text-slate-700 shadow-2xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => selectQI("daily_prayer_done", "prayer_i_done", "Q")}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                            form.daily_prayer_done
                              ? "bg-[#1e1b4b] text-[#fea619] shadow-sm"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          <span>✓ Q (7/7j)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => selectQI("daily_prayer_done", "prayer_i_done", "I")}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                            form.prayer_i_done
                              ? "bg-amber-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          <span>✓ I (Interm.)</span>
                        </button>
                      </div>
                    </div>

                    {/* Jeûne */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="font-extrabold text-xs text-[#1e1b4b] flex items-center gap-2">
                        <span>⚡</span> Jeûne Hebdomadaire
                      </span>
                      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/50">
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, fasting_q_done: false, fasting_i_done: false }))}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            !form.fasting_q_done
                              ? "bg-white text-slate-700 shadow-2xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, fasting_q_done: true, fasting_i_done: false }))}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                            form.fasting_q_done
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          <span>Oui ✓</span>
                        </button>
                      </div>
                    </div>

                    {/* Méditation */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="font-extrabold text-xs text-[#1e1b4b] flex items-center gap-2">
                        <span>📖</span> Méditation Biblique
                      </span>
                      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/50">
                        <button
                          type="button"
                          onClick={() => selectQI("daily_meditation_done", "meditation_i_done", "NONE")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                            !form.daily_meditation_done && !form.meditation_i_done
                              ? "bg-white text-slate-700 shadow-2xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => selectQI("daily_meditation_done", "meditation_i_done", "Q")}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                            form.daily_meditation_done
                              ? "bg-[#1e1b4b] text-[#fea619] shadow-sm"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          <span>✓ Q (7/7j)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => selectQI("daily_meditation_done", "meditation_i_done", "I")}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                            form.meditation_i_done
                              ? "bg-amber-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          <span>✓ I (Interm.)</span>
                        </button>
                      </div>
                    </div>

                    {/* Écoute de la Parole */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="font-extrabold text-xs text-[#1e1b4b] flex items-center gap-2">
                        <span>🎧</span> Écoute de la Parole
                      </span>
                      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/50">
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, word_listening_q_done: false, word_listening_i_done: false }))}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            !form.word_listening_q_done
                              ? "bg-white text-slate-700 shadow-2xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, word_listening_q_done: true, word_listening_i_done: false }))}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                            form.word_listening_q_done
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          <span>Oui ✓</span>
                        </button>
                      </div>
                    </div>

                    {/* Livre médité */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                      <label className="text-[11px] font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                        <span>📖</span> Livre / Chapitre Médité
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Épître aux Romains - Chapitre 8..."
                        value={form.meditated_book}
                        onChange={(e) => setForm({ ...form, meditated_book: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e1b4b]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. ACTIVITÉS MENSUELLES & CHAÎNES */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                      <span>🗓️</span> 4. Devoirs Mensuels & Chaînes
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      onClick={() => setForm({ ...form, monthly_pre_service_intercession: !form.monthly_pre_service_intercession })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.monthly_pre_service_intercession ? "bg-indigo-50/90 border-indigo-300 text-indigo-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold">Intercession avant culte</span>
                      <span className="text-[11px] font-black">{form.monthly_pre_service_intercession ? "✓ Fait" : "Non"}</span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, monthly_in_person_prayer_done: !form.monthly_in_person_prayer_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.monthly_in_person_prayer_done ? "bg-indigo-50/90 border-indigo-300 text-indigo-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold">Prière en présentiel</span>
                      <span className="text-[11px] font-black">{form.monthly_in_person_prayer_done ? "✓ Fait" : "Non"}</span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, monthly_anagkazo: !form.monthly_anagkazo })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.monthly_anagkazo ? "bg-indigo-50/90 border-indigo-300 text-indigo-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold">Anagkazo mensuel</span>
                      <span className="text-[11px] font-black">{form.monthly_anagkazo ? "✓ Fait" : "Non"}</span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, monthly_group_evangelization: !form.monthly_group_evangelization })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.monthly_group_evangelization ? "bg-indigo-50/90 border-indigo-300 text-indigo-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold">Évangélisation groupe</span>
                      <span className="text-[11px] font-black">{form.monthly_group_evangelization ? "✓ Fait" : "Non"}</span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, monthly_prayer_vigil_done: !form.monthly_prayer_vigil_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.monthly_prayer_vigil_done ? "bg-purple-50/90 border-purple-300 text-purple-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold">Mini veillée prière</span>
                      <span className="text-[11px] font-black">{form.monthly_prayer_vigil_done ? "✓ Fait" : "Non"}</span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, prayer_chain_done: !form.prayer_chain_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.prayer_chain_done ? "bg-amber-50/90 border-amber-300 text-amber-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold">Chaîne de prière</span>
                      <span className="text-[11px] font-black">{form.prayer_chain_done ? "✓ Fait" : "Non"}</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN (6 cols): Travail du Berger, Programmes & Observations */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 2. TRAVAIL DU BERGER */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                      <span>🐑</span> 2. Travail & Actions Pastorales
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      onClick={() => setForm({ ...form, evangelization_done: !form.evangelization_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.evangelization_done ? "bg-emerald-50/90 border-emerald-300 text-emerald-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🕊️</span>
                        <span className="text-xs font-black">Évangélisation</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                        form.evangelization_done ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400 border-slate-200"
                      }`}>
                        {form.evangelization_done ? "Fait ✓" : "Non"}
                      </span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, mentoring_done: !form.mentoring_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.mentoring_done ? "bg-indigo-50/90 border-indigo-300 text-indigo-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🌱</span>
                        <span className="text-xs font-black">Encadrement</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                        form.mentoring_done ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-400 border-slate-200"
                      }`}>
                        {form.mentoring_done ? "Fait ✓" : "Non"}
                      </span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, visits_done: !form.visits_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.visits_done ? "bg-purple-50/90 border-purple-300 text-purple-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🏡</span>
                        <span className="text-xs font-black">Visites Domicile</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                        form.visits_done ? "bg-purple-600 text-white border-purple-600" : "bg-white text-slate-400 border-slate-200"
                      }`}>
                        {form.visits_done ? "Fait ✓" : "Non"}
                      </span>
                    </label>

                    <label
                      onClick={() => setForm({ ...form, phone_calls_done: !form.phone_calls_done })}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        form.phone_calls_done ? "bg-amber-50/90 border-amber-300 text-amber-950" : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span className="text-xs font-black">Appels Suivi</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                        form.phone_calls_done ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-400 border-slate-200"
                      }`}>
                        {form.phone_calls_done ? "Fait ✓" : "Non"}
                      </span>
                    </label>
                  </div>

                  {/* Compteurs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">📞 Appels</label>
                      <input
                        type="number"
                        min="0"
                        value={form.phone_calls_count}
                        onChange={(e) => setForm({ ...form, phone_calls_count: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-black text-[#1e1b4b] mt-1"
                      />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">👤 Invités P.</label>
                      <input
                        type="number"
                        min="0"
                        value={form.personal_invites_count}
                        onChange={(e) => setForm({ ...form, personal_invites_count: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-black text-[#1e1b4b] mt-1"
                      />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">👥 Invités G.</label>
                      <input
                        type="number"
                        min="0"
                        value={form.group_invites_count}
                        onChange={(e) => setForm({ ...form, group_invites_count: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-black text-[#1e1b4b] mt-1"
                      />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">✨ Revenues</label>
                      <input
                        type="number"
                        min="0"
                        value={form.recovered_souls_count}
                        onChange={(e) => setForm({ ...form, recovered_souls_count: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-black text-[#1e1b4b] mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. PROGRAMMES D'ÉGLISE (Présence des Membres - Automatisé) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                        <span>👥</span> 3. Présence des Membres aux Programmes
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Calculé automatiquement à partir de vos appels pour la semaine sélectionnée.
                      </p>
                    </div>
                    <Link
                      href="/attendance"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all self-start sm:self-auto"
                    >
                      <span>📋 Faire le pointage</span>
                      <span>→</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {programsSummary.map((prog) => (
                      <div
                        key={prog.program_type}
                        className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/60 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5">
                            <span>{prog.icon}</span>
                            <span>{prog.label}</span>
                          </span>
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                            {prog.ratio_pct}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1 border-t border-slate-200/50">
                          <span>Présents :</span>
                          <span className="font-black text-[#1e1b4b]">
                            {prog.present_count} <span className="text-[10px] font-normal text-slate-400">/ {prog.eligible_count} éligibles</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. THÈME & OBSERVATIONS */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                      <span>📝</span> 5. Thème & Observations
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Thème d&apos;encadrement de la semaine :</label>
                      <input
                        type="text"
                        placeholder="Ex: La consécration par la prière..."
                        value={form.mentoring_theme}
                        onChange={(e) => setForm({ ...form, mentoring_theme: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#1e1b4b] focus:outline-none focus:border-[#1e1b4b]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Observations / Requêtes :</label>
                      <textarea
                        rows={2}
                        placeholder="Remarques particulières, défis ou sujets de prière..."
                        value={form.other_observations}
                        onChange={(e) => setForm({ ...form, other_observations: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#1e1b4b] focus:outline-none focus:border-[#1e1b4b] resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Sticky/Prominent Submit Button */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xl shadow-slate-200/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 font-medium">
                🔒 Assurez-vous de vérifier le choix mutuellement exclusif entre <strong className="text-[#1e1b4b]">Q (Quotidien)</strong> et <strong className="text-amber-700">I (Intermittent)</strong>.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-white bg-[#1e1b4b] hover:bg-[#2d2975] shadow-xl shadow-indigo-950/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{saving ? "Enregistrement en cours..." : "Enregistrer ma consécration"}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: HISTORY VIEW (Eliminates sidebar height mismatch and scroll bugs) */}
        {mainTab === "history" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-black text-[#1e1b4b] flex items-center gap-2">
                  <span>📜</span>
                  <span>Journal et Historique des Disciplines</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Sélectionnez une semaine ci-dessous pour l&apos;ouvrir et modifier ou consulter ses détails dans le formulaire.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-900 font-extrabold text-xs border border-indigo-200 self-start sm:self-center">
                {activities.length} semaine(s) enregistrée(s)
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-12 text-center text-sm font-semibold text-slate-500 space-y-2">
                <div className="text-3xl">📭</div>
                <p>Aucun historique de discipline enregistré pour le moment.</p>
                <button
                  type="button"
                  onClick={() => setMainTab("form")}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-[#1e1b4b] text-[#fea619] font-black text-xs shadow-md"
                >
                  Remplir pour cette semaine
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map((act) => {
                  const isSelected = act.week_start_date === selectedWeek;
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        setSelectedWeek(act.week_start_date);
                        setMainTab("form");
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-50/90 to-purple-50/80 border-[#1e1b4b] shadow-md shadow-indigo-500/10 ring-2 ring-[#1e1b4b]/20"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black text-[#1e1b4b] bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                            {formatWeekInterval(act.week_start_date)}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold text-[#fea619] bg-[#1e1b4b] px-2 py-0.5 rounded-full">
                              Sélectionné ✓
                            </span>
                          )}
                        </div>

                        {act.meditated_book && (
                          <div className="mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center gap-2 text-xs font-extrabold text-amber-950 truncate">
                            <span>📖</span>
                            <span className="truncate">{act.meditated_book}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-200/60 text-[11px]">
                          <div className={`py-1.5 px-2 rounded-xl font-bold truncate ${
                            act.daily_prayer_done ? "bg-purple-100/80 text-purple-900" : act.prayer_i_done ? "bg-amber-100/80 text-amber-900" : "bg-slate-100 text-slate-500"
                          }`}>
                            Prière: {act.daily_prayer_done ? "Q (7/7)" : act.prayer_i_done ? "I (Int.)" : "Non"}
                          </div>
                          <div className={`py-1.5 px-2 rounded-xl font-bold truncate ${
                            act.daily_meditation_done ? "bg-emerald-100/80 text-emerald-900" : act.meditation_i_done ? "bg-amber-100/80 text-amber-900" : "bg-slate-100 text-slate-500"
                          }`}>
                            Médit: {act.daily_meditation_done ? "Q (7/7)" : act.meditation_i_done ? "I (Int.)" : "Non"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-extrabold text-indigo-600">
                        <span>Ouvrir dans le formulaire</span>
                        <span>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

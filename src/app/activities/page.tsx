"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import WeekSelector from "@/components/common/WeekSelector";
import { Profile, ShepherdActivity, ProgramSummaryItem, Member } from "@/types/db";
import { computeProgramsSummary } from "@/lib/utils/programs";
import { DailyDisciplinesSection } from "@/components/activities/DailyDisciplinesSection";
import { PastoralActionsSection } from "@/components/activities/PastoralActionsSection";
import { ProgramsPresenceCard } from "@/components/activities/ProgramsPresenceCard";
import { MonthlyActivitiesSection } from "@/components/activities/MonthlyActivitiesSection";
import { ObservationsSection } from "@/components/activities/ObservationsSection";

export default function ShepherdActivitiesPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
  });

  const [activities, setActivities] = useState<ShepherdActivity[]>([]);
  const [programsSummary, setProgramsSummary] = useState<ProgramSummaryItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    daily_prayer_q_done: false,
    daily_prayer_i_done: false,
    bible_reading_q_done: false,
    bible_reading_i_done: false,
    meditation_q_done: false,
    meditation_i_done: false,
    meditation_book: "",
    meditation_chapter_start: "" as number | "",
    meditation_chapter_end: "" as number | "",
    evangelism_q_done: false,
    evangelism_i_done: false,

    pastoral_souls_won: 0,
    pastoral_new_contacts: 0,
    pastoral_first_timers: 0,
    pastoral_home_visits: 0,
    pastoral_sick_visits: 0,
    pastoral_consolation_visits: 0,
    pastoral_followup_calls: 0,

    monthly_pre_service_intercession: false,
    monthly_in_person_prayer_done: false,
    monthly_anagkazo: false,
    monthly_group_evangelization: false,
    monthly_prayer_vigil_done: false,
    prayer_chain_done: false,

    mentoring_theme: "",
    other_observations: "",
  });

  // 1. Initial Load: profile & shepherd activities
  useEffect(() => {
    async function initLoad() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("*, groups!profiles_group_id_fkey(name)")
          .eq("id", user.id)
          .single();

        if (profErr || !prof) {
          router.push("/profile");
          return;
        }
        setProfile(prof as Profile);

        const { data: actData } = await supabase
          .from("shepherd_activities")
          .select("*")
          .order("week_start_date", { ascending: false });

        if (actData) {
          setActivities(actData as ShepherdActivity[]);
        }
      } catch (e) {
        console.error("Erreur de chargement profil/activités:", e);
      } finally {
        setLoading(false);
      }
    }
    initLoad();
  }, [router, supabase]);

  // 2. Load form state when selectedWeek or activities change
  useEffect(() => {
    if (!profile) return;

    const currentAct = activities.find(
      (a) => a.shepherd_id === profile.id && a.week_start_date === selectedWeek
    );

    if (currentAct) {
      setForm({
        daily_prayer_q_done: currentAct.daily_prayer_q_done || false,
        daily_prayer_i_done: currentAct.daily_prayer_i_done || false,
        bible_reading_q_done: currentAct.bible_reading_q_done || false,
        bible_reading_i_done: currentAct.bible_reading_i_done || false,
        meditation_q_done: currentAct.meditation_q_done || false,
        meditation_i_done: currentAct.meditation_i_done || false,
        meditation_book: currentAct.meditation_book || "",
        meditation_chapter_start: currentAct.meditation_chapter_start ?? "",
        meditation_chapter_end: currentAct.meditation_chapter_end ?? "",
        evangelism_q_done: currentAct.evangelism_q_done || false,
        evangelism_i_done: currentAct.evangelism_i_done || false,

        pastoral_souls_won: currentAct.pastoral_souls_won || 0,
        pastoral_new_contacts: currentAct.pastoral_new_contacts || 0,
        pastoral_first_timers: currentAct.pastoral_first_timers || 0,
        pastoral_home_visits: currentAct.pastoral_home_visits || 0,
        pastoral_sick_visits: currentAct.pastoral_sick_visits || 0,
        pastoral_consolation_visits: currentAct.pastoral_consolation_visits || 0,
        pastoral_followup_calls: currentAct.pastoral_followup_calls || 0,

        monthly_pre_service_intercession: currentAct.monthly_pre_service_intercession || false,
        monthly_in_person_prayer_done: currentAct.monthly_in_person_prayer_done || currentAct.monthly_in_person_done || false,
        monthly_anagkazo: currentAct.monthly_anagkazo || false,
        monthly_group_evangelization: currentAct.monthly_group_evangelization || false,
        monthly_prayer_vigil_done: currentAct.monthly_prayer_vigil_done || currentAct.monthly_vigil_done || false,
        prayer_chain_done: currentAct.prayer_chain_done || false,

        mentoring_theme: currentAct.mentoring_theme || "",
        other_observations: currentAct.other_observations || "",
      });
    } else {
      // Default empty state
      setForm({
        daily_prayer_q_done: false,
        daily_prayer_i_done: false,
        bible_reading_q_done: false,
        bible_reading_i_done: false,
        meditation_q_done: false,
        meditation_i_done: false,
        meditation_book: "",
        meditation_chapter_start: "",
        meditation_chapter_end: "",
        evangelism_q_done: false,
        evangelism_i_done: false,

        pastoral_souls_won: 0,
        pastoral_new_contacts: 0,
        pastoral_first_timers: 0,
        pastoral_home_visits: 0,
        pastoral_sick_visits: 0,
        pastoral_consolation_visits: 0,
        pastoral_followup_calls: 0,

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
  }, [selectedWeek, activities, profile]);

  // 3. Load attendance summary for the 5 programs (Automated presence check)
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
          .select("id, status, current_class, archived_at")
          .is("archived_at", null)
          .neq("status", "archived");

        if (profile.role === "shepherd") {
          memQuery = memQuery.eq("shepherd_id", profile.id);
        }
        const { data: mems } = await memQuery;
        const membersList = (mems as Member[]) || [];
        const memIds = membersList.map((m) => m.id);

        const { data: attData } = memIds.length > 0
          ? await supabase
              .from("attendance")
              .select("member_id, program_type, is_present, date")
              .in("member_id", memIds)
              .gte("date", mondayStr)
              .lte("date", sundayStr)
          : { data: [] };

        const summary = computeProgramsSummary(membersList, attData || []);
        setProgramsSummary(summary);
      } catch (e) {
        console.error("Erreur calcul présence programmes:", e);
      }
    }
    loadAttendanceSummary();
  }, [selectedWeek, profile, supabase]);

  // Helper for strictly mutually exclusive Q/I choice
  const selectQI = (qField: string, iField: string, choice: "Q" | "I" | "NONE") => {
    if (choice === "Q") {
      setForm((prev: any) => ({ ...prev, [qField]: true, [iField]: false }));
    } else if (choice === "I") {
      setForm((prev: any) => ({ ...prev, [qField]: false, [iField]: true }));
    } else {
      setForm((prev: any) => ({ ...prev, [qField]: false, [iField]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        shepherd_id: profile.id,
        week_start_date: selectedWeek,
        daily_prayer_q_done: form.daily_prayer_q_done,
        daily_prayer_i_done: form.daily_prayer_i_done,
        bible_reading_q_done: form.bible_reading_q_done,
        bible_reading_i_done: form.bible_reading_i_done,
        meditation_q_done: form.meditation_q_done,
        meditation_i_done: form.meditation_i_done,
        meditation_book: form.meditation_book || null,
        meditation_chapter_start: form.meditation_chapter_start !== "" ? Number(form.meditation_chapter_start) : null,
        meditation_chapter_end: form.meditation_chapter_end !== "" ? Number(form.meditation_chapter_end) : null,
        evangelism_q_done: form.evangelism_q_done,
        evangelism_i_done: form.evangelism_i_done,

        pastoral_souls_won: form.pastoral_souls_won,
        pastoral_new_contacts: form.pastoral_new_contacts,
        pastoral_first_timers: form.pastoral_first_timers,
        pastoral_home_visits: form.pastoral_home_visits,
        pastoral_sick_visits: form.pastoral_sick_visits,
        pastoral_consolation_visits: form.pastoral_consolation_visits,
        pastoral_followup_calls: form.pastoral_followup_calls,

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9] flex items-center justify-center text-[#1e1b4b]">
        <div className="glass-panel px-8 py-6 rounded-3xl shadow-xl flex items-center gap-4 border border-white/80 font-bold text-sm">
          <div className="w-6 h-6 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
          <span>Chargement de la discipline et consécration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9] text-[#1e1b4b] pb-24 font-sans selection:bg-[#fea619]/20">
      <Navbar
        role={profile?.role || "shepherd"}
        groupName={profile?.groups?.name}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-md border border-white/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-2.5 border border-[#fea619]/40 shadow-2xs">
                <span className="material-symbols-outlined text-[15px] text-[#fea619]">self_improvement</span>
                <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Discipline & Consécration</span>
              </div>
              <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#1e1b4b] tracking-tight">
                Suivi Spirituel du Berger
              </h1>
              <p className="text-[#47464f] text-xs sm:text-sm mt-1.5 font-medium max-w-2xl leading-relaxed">
                Remplissez quotidiennement et hebdomadairement vos disciplines (Q = Quotidien 7/7j, I = Intermittent, mutuellement exclusifs), vos actions pastorales et vos présences.
              </p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-white/80 shrink-0 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Semaine de référence
              </span>
              <WeekSelector selectedDate={selectedWeek} onChangeDate={setSelectedWeek} />
            </div>
          </div>
        </div>

        {message && (
          <div className="glass-panel p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-sm font-black flex items-center justify-between shadow-md shadow-emerald-500/10 animate-fadeIn">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span>✓ {message}</span>
            </span>
            <button onClick={() => setMessage(null)} className="text-emerald-800 font-black ml-4 hover:opacity-75">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <DailyDisciplinesSection form={form} setForm={setForm} selectQI={selectQI} />
          <PastoralActionsSection form={form} setForm={setForm} />
          <ProgramsPresenceCard programsSummary={programsSummary} />
          <MonthlyActivitiesSection form={form} setForm={setForm} />
          <ObservationsSection form={form} setForm={setForm} />

          {/* Sticky/Prominent Submit Button */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl shadow-xl border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-30">
            <div className="text-xs text-slate-600 font-medium">
              🔒 Assurez-vous d&apos;avoir vérifié les choix exclusifs entre <strong className="text-[#1e1b4b]">Q (Quotidien)</strong> et <strong className="text-[#fea619]">I (Intermittent)</strong> avant d&apos;enregistrer.
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-[#1e1b4b] bg-gradient-to-r from-[#fea619] via-[#ffb947] to-[#fea619] hover:from-amber-400 hover:to-amber-400 shadow-xl shadow-[#fea619]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-[#1e1b4b] border-t-transparent animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <span>💾 Enregistrer la Discipline & Consécration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

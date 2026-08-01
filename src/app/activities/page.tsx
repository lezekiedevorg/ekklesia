"use client";

import React, { useState, useEffect } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import WeekSelector from "@/components/common/WeekSelector";
import { Profile, ShepherdActivity, ProgramSummaryItem, Member } from "@/types/db";
import { computeProgramsSummary } from "@/lib/utils/programs";
import { getProgramsClient } from "@/lib/utils/programs-data";
import { DailyDisciplinesSection } from "@/components/activities/DailyDisciplinesSection";
import { PastoralActionsSection } from "@/components/activities/PastoralActionsSection";
import { ProgramsPresenceCard } from "@/components/activities/ProgramsPresenceCard";
import { MonthlyActivitiesSection } from "@/components/activities/MonthlyActivitiesSection";
import { ObservationsSection } from "@/components/activities/ObservationsSection";
import {
  QI_DISCIPLINES,
  YESNO_DISCIPLINES,
  SHEPHERD_WORK_ITEMS,
  SHEPHERD_ATTENDANCE_ITEMS,
  MONTHLY_ITEMS,
  SOULS_COUNTERS,
} from "@/lib/constants/programs";

// Le formulaire est dérivé des définitions du rapport officiel : une colonne
// oubliée ici ne peut plus l'être dans le payload, les deux viennent d'ici.
const BLANK_FORM: Record<string, any> = {
  ...Object.fromEntries(QI_DISCIPLINES.flatMap((d) => [[d.q, false], [d.i, false]])),
  ...Object.fromEntries(YESNO_DISCIPLINES.map((d) => [d.key, false])),
  ...Object.fromEntries(SHEPHERD_WORK_ITEMS.map((i) => [i.key, false])),
  ...Object.fromEntries(SHEPHERD_ATTENDANCE_ITEMS.map((i) => [i.key, false])),
  ...Object.fromEntries(MONTHLY_ITEMS.map((i) => [i.key, false])),
  ...Object.fromEntries(SOULS_COUNTERS.map((c) => [c.key, 0])),
  phone_calls_count: 0,
  meditated_book: "",
  mentoring_theme: "",
  other_observations: "",
};

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
  const [absentees, setAbsentees] = useState<{ name: string; reason: string }[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Form state (clés = colonnes réelles de shepherd_activities)
  const [form, setForm] = useState<Record<string, any>>(BLANK_FORM);

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

        // Le leader n'a pas accès à la page des disciplines (c'est au berger de remplir)
        if (prof.role === "leader") {
          router.push("/");
          return;
        }

        const { data: actData } = await supabase
          .from("shepherd_activities")
          .select("*")
          .eq("shepherd_id", prof.id)
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
      const hydrated: Record<string, any> = { ...BLANK_FORM };
      Object.keys(BLANK_FORM).forEach((key) => {
        const value = (currentAct as any)[key];
        if (value !== null && value !== undefined) hydrated[key] = value;
      });
      setForm(hydrated);
    } else {
      setForm(BLANK_FORM);
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
          .select("id, first_name, last_name, status, current_class, archived_at")
          .is("archived_at", null)
          .neq("status", "archived")
          .eq("shepherd_id", profile.id);
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

        const programList = await getProgramsClient();
        const summary = computeProgramsSummary(membersList, attData || [], programList);
        setProgramsSummary(summary);

        // "Noms des absents et raison" du rapport : repris du pointage dominical
        const { data: reasons } = memIds.length > 0
          ? await supabase
              .from("sunday_absences")
              .select("member_id, reason")
              .eq("program_type", "sunday_service")
              .in("member_id", memIds)
              .gte("date", mondayStr)
              .lte("date", sundayStr)
          : { data: [] };

        const reasonByMember = new Map((reasons || []).map((r) => [r.member_id, r.reason]));
        const presentSunday = new Set(
          (attData || [])
            .filter((a) => a.program_type === "sunday_service" && a.is_present)
            .map((a) => a.member_id)
        );
        const pointedSunday = (attData || []).some((a) => a.program_type === "sunday_service");

        setAbsentees(
          pointedSunday
            ? membersList
                .filter((m) => !presentSunday.has(m.id))
                .map((m) => ({
                  name: `${m.first_name} ${m.last_name}`,
                  reason: reasonByMember.get(m.id) || "Absence non justifiée",
                }))
            : []
        );
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
        ...form,
        shepherd_id: profile.id,
        week_start_date: selectedWeek,
        meditated_book: form.meditated_book || null,
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
    return <PageLoader label="Chargement de la discipline et consécration..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9] text-[#1e1b4b] pb-24 font-sans selection:bg-[#fea619]/20">

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
          <ProgramsPresenceCard programsSummary={programsSummary} form={form} setForm={setForm} selectedWeek={selectedWeek} />
          <MonthlyActivitiesSection form={form} setForm={setForm} />
          <ObservationsSection form={form as any} setForm={setForm} absentees={absentees} />

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

"use client";

import React, { useEffect, useState, useRef } from "react";
import PageLoader from "@/components/common/PageLoader";
import { hasGlobalScope, hasOwnScope } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import WeekSelector from "@/components/common/WeekSelector";
import { getDayOfWeekIndex } from "@/lib/utils/dateFormatter";
import { getProgramsClient } from "@/lib/utils/programs-data";
import { PROGRAM_DEFINITIONS, ProgramDefinition } from "@/lib/constants/programs";

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

type ProgramType = string;

export default function AttendancePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Program selection & Date
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>("sunday_service");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [programs, setPrograms] = useState<ProgramDefinition[]>(PROGRAM_DEFINITIONS);

  useEffect(() => {
    getProgramsClient().then(setPrograms);
  }, []);

  // Liste rapide par défaut, pas-à-pas en option
  const [viewMode, setViewMode] = useState<"list" | "wizard">("list");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [memberFilter, setMemberFilter] = useState<"all" | "newcomers" | "members">("all");

  // Attendance state: member_id -> boolean
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  // Motif d'absence (tous programmes) : member_id -> motif
  const [absenceReasons, setAbsenceReasons] = useState<Record<string, string>>({});

  // Week overview state: { "YYYY-MM-DD_memberId": boolean }
  const [weekAttendance, setWeekAttendance] = useState<Record<string, boolean>>({});
  const [weekOverviewOpen, setWeekOverviewOpen] = useState(true);

  // Day -> program mapping for week view
  const dayProgramMap: Record<number, string> = {
    0: "sunday_service", 1: "", 2: "tuesday_class", 3: "wednesday_class",
    4: "thursday_online", 5: "friday_service", 6: "",
  };

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryAppliedRef = useRef(false);

  // Programme -> jour de la semaine pour déduire la date automatiquement
  const programDayMap: Record<string, "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = {
    tuesday_class: "tuesday",
    wednesday_class: "wednesday",
    thursday_online: "thursday",
    friday_service: "friday",
    sunday_service: "sunday",
  };

  // Apply query params from activities page: ?program=...&week=...
  useEffect(() => {
    if (queryAppliedRef.current) return;
    const programParam = searchParams.get("program");
    const weekParam = searchParams.get("week");
    if (programParam) {
      setSelectedProgram(programParam);
      if (weekParam) {
        const dayName = programDayMap[programParam];
        if (dayName) {
          const parts = weekParam.split("-").map(Number);
          if (parts.length >= 3 && !isNaN(parts[0])) {
            const monday = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            const targetDay = getDayOfWeekIndex(dayName);
            const currentDay = monday.getUTCDay();
            const diff = ((targetDay - currentDay + 7) % 7);
            const target = new Date(monday);
            target.setUTCDate(monday.getUTCDate() + diff);
            const y = target.getUTCFullYear();
            const m = String(target.getUTCMonth() + 1).padStart(2, "0");
            const d = String(target.getUTCDate()).padStart(2, "0");
            setSelectedDate(`${y}-${m}-${d}`);
          }
        }
      }
      queryAppliedRef.current = true;
    }
  }, [searchParams]);

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

        // Le leader n'a pas accès à la page des présences (c'est au berger de pointer)
        if (prof.role === "leader") {
          router.push("/");
          return;
        }

        // Fetch members for this user/group
        let query = supabase.from("members").select("*").is("archived_at", null).neq("status", "archived").order("first_name", { ascending: true });
        if (hasOwnScope(prof.role)) {
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

  // Auto-adjust selectedDate when program changes: each program has its day of the week
  useEffect(() => {
    const dayName = programDayMap[selectedProgram];
    if (!dayName) return;
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const currentDow = d.getUTCDay();
    const targetDow = getDayOfWeekIndex(dayName);
    if (currentDow === targetDow) return;
    // Go to Monday, then offset to target day
    const diffToMonday = currentDow === 0 ? -6 : 1 - currentDow;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diffToMonday);
    const offsetFromMonday = targetDow === 0 ? 6 : targetDow - 1;
    const target = new Date(monday);
    target.setUTCDate(monday.getUTCDate() + offsetFromMonday);
    const y = target.getUTCFullYear();
    const m = String(target.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(target.getUTCDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${dd}`);
  }, [selectedProgram]);

  // Compute day view attendance directly from weekAttendance (no DB query needed)
  useEffect(() => {
    if (!profile || members.length === 0) return;
    const prog = programs.find((p) => p.id === selectedProgram);
    const eligible = members.filter((m) => {
      if (m.archived_at) return false;
      if (prog?.eligibility_class) return m.current_class === prog.eligibility_class;
      return true;
    });
    const state: Record<string, boolean> = {};
    eligible.forEach((m) => {
      const val = weekAttendance[`${selectedDate}_${m.id}`];
      if (val !== undefined) state[m.id] = val;
    });
    setAttendanceState(state);
  }, [selectedDate, selectedProgram, weekAttendance, members, programs, profile]);

  // Load week attendance data for ALL programs (week overview)
  useEffect(() => {
    async function loadWeekAttendance() {
      if (!profile || members.length === 0) return;
      try {
        const parts = selectedDate.split("-").map(Number);
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        const dayOfWeek = d.getUTCDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setUTCDate(d.getUTCDate() + diffToMonday);

        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setUTCDate(monday.getUTCDate() + i);
          const y = date.getUTCFullYear();
          const m = String(date.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(date.getUTCDate()).padStart(2, "0");
          weekDates.push(`${y}-${m}-${dd}`);
        }

        const mondayStr = weekDates[0];
        const sundayStr = weekDates[6];

        // Fetch ALL attendance for the week (all programs)
        const { data: weekAttData } = await supabase
          .from("attendance")
          .select("member_id, is_present, date, program_type")
          .gte("date", mondayStr)
          .lte("date", sundayStr);

        // Build weekAttendance grid with composite keys
        const grid: Record<string, boolean> = {};
        (weekAttData || []).forEach((rec: any) => {
          grid[`${rec.date}_${rec.member_id}`] = rec.is_present;
        });
        setWeekAttendance(grid);
      } catch (err) {
        console.error("Erreur chargement présences semaine:", err);
      }
    }
    loadWeekAttendance();
  }, [selectedDate, profile, members, supabase]);

  // Save all week attendance (all programs)
  const handleSaveWeekAttendance = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const allRecords: { member_id: string; date: string; program_type: string; is_present: boolean }[] = [];
      const isGlobalAdmin = hasGlobalScope(profile?.role);
      Object.entries(weekAttendance).forEach(([key, isPresent]) => {
        const lastUnderscore = key.lastIndexOf("_");
        const date = key.substring(0, lastUnderscore);
        const memberId = key.substring(lastUnderscore + 1);
        // Skip locked dates (7-day rule + week boundary)
        if (!isGlobalAdmin) {
          const now = new Date();
          const sel = new Date(date + "T00:00:00");
          const diffDays = (now.getTime() - sel.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return;
          const todayDow = now.getDay();
          const todayMon = new Date(now);
          todayMon.setDate(now.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
          todayMon.setHours(0, 0, 0, 0);
          const selDow = sel.getDay();
          const selMon = new Date(sel);
          selMon.setDate(sel.getDate() - (selDow === 0 ? 6 : selDow - 1));
          selMon.setHours(0, 0, 0, 0);
          if (todayMon.getTime() > selMon.getTime()) return;
        }
        // Determine program from the day of the week
        const dateParts = date.split("-").map(Number);
        const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
        const dow = dateObj.getUTCDay();
        const progType = dayProgramMap[dow];
        if (progType) {
          allRecords.push({ member_id: memberId, date, program_type: progType, is_present: isPresent });
        }
      });

      if (allRecords.length > 0) {
        const { error } = await supabase
          .from("attendance")
          .upsert(allRecords, { onConflict: "member_id,date,program_type" });
        if (error) throw error;
      }

      setMessage(`${allRecords.length} présences de la semaine enregistrées avec succès !`);

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
      alert(`Erreur lors de l'enregistrement : ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // All active members (no program filter — used in week view), newcomers first
  const activeMembers = members
    .filter((m) => !m.archived_at)
    .filter((m) => memberFilter === "all" || (memberFilter === "newcomers" && m.status === "new") || (memberFilter === "members" && m.status !== "new"))
    .sort((a, b) => {
      if (a.status === "new" && b.status !== "new") return -1;
      if (a.status !== "new" && b.status === "new") return 1;
      return a.first_name.localeCompare(b.first_name);
    });

  // Filter out archived members and match program rules, newcomers first
  const eligibleMembers = members
    .filter((m) => {
      if (m.archived_at) return false;
      if (memberFilter === "newcomers" && m.status !== "new") return false;
      if (memberFilter === "members" && m.status === "new") return false;
      const prog = programs.find((p) => p.id === selectedProgram);
      if (prog?.eligibility_class) {
        return m.current_class === prog.eligibility_class;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.status === "new" && b.status !== "new") return -1;
      if (a.status !== "new" && b.status === "new") return 1;
      return a.first_name.localeCompare(b.first_name);
    });



  // Reset view mode when date or program changes
  useEffect(() => {
    setViewMode("list");
    setMessage(null);
  }, [selectedDate, selectedProgram]);

  // Calculate lock (day view): locked if more than 7 days ago OR if the week is past
  const isLocked = (() => {
    if (hasGlobalScope(profile?.role)) return false;
    const now = new Date();
    const sel = new Date(selectedDate + "T00:00:00");
    const diffTime = now.getTime() - sel.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    if (diffDays > 7) return true;

    // Week boundary lock
    const todayDay = now.getDay();
    const todayMonday = new Date(now);
    todayMonday.setDate(now.getDate() - (todayDay === 0 ? 6 : todayDay - 1));
    todayMonday.setHours(0, 0, 0, 0);

    const selDay = sel.getDay();
    const selMonday = new Date(sel);
    selMonday.setDate(sel.getDate() - (selDay === 0 ? 6 : selDay - 1));
    selMonday.setHours(0, 0, 0, 0);

    return todayMonday.getTime() > selMonday.getTime();
  })();

  // Per-date lock check (week view): locked if more than 7 days ago OR if the week is past
  const isDateLocked = (dateStr: string): boolean => {
    if (hasGlobalScope(profile?.role)) return false;
    const now = new Date();
    const sel = new Date(dateStr + "T00:00:00");
    const diffTime = now.getTime() - sel.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    if (diffDays > 7) return true;

    // Week boundary lock: if today's Monday is after the date's Monday, the week is past
    const todayDay = now.getDay();
    const todayMonday = new Date(now);
    todayMonday.setDate(now.getDate() - (todayDay === 0 ? 6 : todayDay - 1));
    todayMonday.setHours(0, 0, 0, 0);

    const selDay = sel.getDay();
    const selMonday = new Date(sel);
    selMonday.setDate(sel.getDate() - (selDay === 0 ? 6 : selDay - 1));
    selMonday.setHours(0, 0, 0, 0);

    return todayMonday.getTime() > selMonday.getTime();
  };

  const advanceWizard = () => {
    if (currentIndex < eligibleMembers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setViewMode("list");
    }
  };

  const handleWizardToggle = (memberId: string, present: boolean) => {
    setAttendanceState((prev) => ({
      ...prev,
      [memberId]: present,
    }));
    if (present) advanceWizard();
  };

  const handleQuickSet = (memberId: string, present: boolean) => {
    if (isLocked) return;
    setAttendanceState((prev) => ({ ...prev, [memberId]: present }));
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

      const absRecords = eligibleMembers
        .filter((m) => !attendanceState[m.id] && absenceReasons[m.id]?.trim())
        .map((m) => ({
          member_id: m.id,
          date: selectedDate,
          program_type: selectedProgram,
          reason: absenceReasons[m.id],
        }));

      if (absRecords.length > 0) {
        await supabase
          .from("sunday_absences")
          .upsert(absRecords, { onConflict: "member_id,date,program_type" });
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

  const programOptions: { id: ProgramType; label: string; desc: string; icon: string }[] = programs.map((p) => ({
    id: p.id,
    label: p.label,
    desc: p.eligibility_class
      ? "Réservé aux membres de cette classe"
      : p.id === "sunday_service"
      ? "Tout le monde convié • Déclenche la règle des 4 dimanches"
      : "Tout le monde convié",
    icon: p.icon,
  }));

  if (loading) {
    return <PageLoader label="Chargement des listes de présence..." />;
  }

  const activeMember = eligibleMembers[currentIndex] || eligibleMembers[0];
  const presentCount = eligibleMembers.filter((m) => attendanceState[m.id] === true).length;
  const markedAbsentCount = eligibleMembers.filter((m) => attendanceState[m.id] === false).length;
  const pendingCount = eligibleMembers.length - presentCount - markedAbsentCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9] text-[#1e1b4b] pb-24 font-sans selection:bg-[#fea619]/20">

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl shadow-md border border-white/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-2.5 border border-[#fea619]/30 shadow-2xs">
                <span className="material-symbols-outlined text-[15px] text-[#fea619]">event_available</span>
                <span className="font-label-caps font-bold text-[11px] uppercase tracking-wider">Pointage & Présences</span>
              </div>
              <h1 className="font-headline-md font-extrabold text-xl sm:text-2xl text-[#1e1b4b] tracking-tight">
                Pointage des Présences
              </h1>
            </div>

            <div className="flex-shrink-0">
              <WeekSelector selectedDate={selectedDate} onChangeDate={setSelectedDate} />
            </div>
          </div>

          {/* Program Type Tabs — visible uniquement en vue jour */}
          {!weekOverviewOpen && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-200/60 relative z-10">
              {programOptions.map((prog) => {
                const isActive = selectedProgram === prog.id;
                return (
                  <button
                    key={prog.id}
                    onClick={() => setSelectedProgram(prog.id)}
                    title={prog.desc}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-[#1e1b4b] text-white border-[#fea619]/60 shadow-md shadow-indigo-950/20"
                        : "bg-white/70 text-slate-600 border-slate-200/80 hover:border-indigo-300 hover:text-[#1e1b4b]"
                    }`}
                  >
                    <span>{prog.icon}</span>
                    {prog.label}
                  </button>
                );
              })}
            </div>
          )}
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

        {/* Toggle Vue Jour / Vue Semaine */}
        {viewMode === "list" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOverviewOpen(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                !weekOverviewOpen
                  ? "bg-[#1e1b4b] text-white border-[#fea619]/60"
                  : "bg-white/70 text-slate-600 border-slate-200/80 hover:border-indigo-300"
              }`}
            >
              Vue jour
            </button>
            <button
              onClick={() => setWeekOverviewOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                weekOverviewOpen
                  ? "bg-[#1e1b4b] text-white border-[#fea619]/60"
                  : "bg-white/70 text-slate-600 border-slate-200/80 hover:border-indigo-300"
              }`}
            >
              Vue semaine
            </button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {([["all", "Tous"], ["newcomers", "Nouveaux"], ["members", "Membres"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setMemberFilter(val)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${memberFilter === val ? "bg-white text-[#1e1b4b] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* VUE SEMAINE GLOBALE : tous les programmes, tous les jours, éligibilité par programme */}
        {viewMode === "list" && weekOverviewOpen && (() => {
          const parts = selectedDate.split("-").map(Number);
          const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
          const dayOfWeek = d.getUTCDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(d);
          monday.setUTCDate(d.getUTCDate() + diffToMonday);

          const todayStr = new Date().toISOString().split("T")[0];

          // Check if the entire week is locked (week is in the past)
          const now = new Date();
          const todayDow = now.getDay();
          const todayMonday = new Date(now);
          todayMonday.setDate(now.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
          todayMonday.setHours(0, 0, 0, 0);
          const weekLocked = !hasGlobalScope(profile?.role) && monday.getTime() < todayMonday.getTime();

          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setUTCDate(monday.getUTCDate() + i);
            const y = date.getUTCFullYear();
            const m = String(date.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(date.getUTCDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${dd}`;
            const dow = date.getUTCDay();
            const dayLabels = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
            const shortLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
            const progId = dayProgramMap[dow];
            const prog = programs.find((p) => p.id === progId);
            const isToday = dateStr === todayStr;

            // Compute eligible members for THIS day's program (exclude newcomers from official count)
            const eligibleForDay = activeMembers.filter((m) => {
              if (m.status === "new") return false;
              if (!prog) return false;
              if (prog.eligibility_class) return m.current_class === prog.eligibility_class;
              return true;
            });
            const eligibleIds = new Set(eligibleForDay.map((m) => m.id));

            // Count present among eligible
            let presentCount = 0;
            eligibleForDay.forEach((m) => {
              if (weekAttendance[`${dateStr}_${m.id}`] === true) presentCount++;
            });

            return { dateStr, dow, dayLabel: dayLabels[dow], shortLabel: shortLabels[dow], dayNum: date.getUTCDate(), month: String(date.getUTCMonth() + 1).padStart(2, "0"), prog, isToday, presentCount, eligibleCount: eligibleForDay.length, eligibleIds };
          });

          return (
            <div className="glass-panel rounded-3xl border border-white/80 shadow-md overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 bg-white/50">
                <h3 className="text-sm font-black text-[#1e1b4b]">
                  Présences de la semaine — Tous les programmes
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {activeMembers.length} membre{activeMembers.length > 1 ? "s" : ""} actif{activeMembers.length > 1 ? "s" : ""}
                </span>
              </div>
              {weekLocked && (
                <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200 text-xs font-bold text-amber-900">
                  🔒 Semaine passée — les présences sont en lecture seule.
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 bg-slate-50/50">
                      <th className="text-left px-4 py-2.5 font-extrabold text-slate-600 sticky left-0 bg-slate-50/80 z-10 min-w-[140px]">
                        Membre
                      </th>
                      {weekDays.map((day, i) => {
                        const dayLocked = day.prog && isDateLocked(day.dateStr);
                        return (
                        <th key={i} className={`px-2 py-2.5 text-center whitespace-nowrap min-w-[80px] ${day.isToday ? "bg-indigo-50" : ""}`}>
                          <div className="font-extrabold text-slate-600 flex items-center justify-center gap-1">
                            {day.shortLabel} {day.dayNum}/{day.month}
                            {dayLocked && <span className="text-slate-300" title="Délai de 7 jours expiré">🔒</span>}
                          </div>
                          {day.prog ? (
                            <>
                              <div className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                                <span>{day.prog.icon}</span>
                                <span className="truncate max-w-[70px]">{day.prog.label.split("(")[0].trim()}</span>
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                {day.presentCount}/{day.eligibleCount}
                              </div>
                            </>
                          ) : (
                            <div className="text-[10px] text-slate-300 mt-0.5">—</div>
                          )}
                        </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {activeMembers.map((member) => (
                      <tr key={member.id} className="border-b border-slate-100/60 hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-2 sticky left-0 bg-white/90 z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 shrink-0 rounded-md bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-white text-[9px] font-black flex items-center justify-center">
                              {member.first_name[0]}{member.last_name[0]}
                            </div>
                            <span className="font-bold text-[#1e1b4b] truncate max-w-[100px] flex items-center gap-1">
                              {member.first_name} {member.last_name}
                              {member.status === "new" && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  Nouveau
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        {weekDays.map((day, i) => {
                          const key = `${day.dateStr}_${member.id}`;
                          const val = weekAttendance[key];
                          const isEligible = day.eligibleIds.has(member.id);
                          const hasProg = !!day.prog;
                          const locked = hasProg && isDateLocked(day.dateStr);
                          return (
                            <td key={i} className={`px-2 py-2 text-center ${day.isToday ? "bg-indigo-50/40" : ""}`}>
                              {!hasProg ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-200 text-xs">—</span>
                              ) : !isEligible ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-300 text-[10px] border border-slate-200/50" title="Non éligible">
                                  N/A
                                </span>
                              ) : locked ? (
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm border ${
                                  val === true
                                    ? "bg-emerald-50 text-emerald-400 border-emerald-200/60"
                                    : val === false
                                    ? "bg-rose-50 text-rose-400 border-rose-200/60"
                                    : "bg-slate-50 text-slate-200 border-slate-200/60"
                                }`} title="Délai de 7 jours expiré">
                                  {val === true ? "✓" : val === false ? "✕" : "—"}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWeekAttendance((prev) => {
                                      const current = prev[key];
                                      const next = current === true ? false : current === false ? undefined : true;
                                      const updated = { ...prev };
                                      if (next === undefined) {
                                        delete updated[key];
                                      } else {
                                        updated[key] = next;
                                      }
                                      return updated;
                                    });
                                  }}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm transition-all cursor-pointer border ${
                                    val === true
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                      : val === false
                                      ? "bg-rose-100 text-rose-700 border-rose-300"
                                      : "bg-slate-50 text-slate-300 border-slate-200 hover:border-indigo-300"
                                  }`}
                                >
                                  {val === true ? "✓" : val === false ? "✕" : "—"}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {activeMembers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-14 text-center text-slate-400 text-xs font-medium">
                          Aucun membre actif.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save button for week view */}
              {activeMembers.length > 0 && (
                <div className="px-5 py-4 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  {weekLocked && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      🔒 Semaine passée — lecture seule
                    </span>
                  )}
                  <button
                    onClick={handleSaveWeekAttendance}
                    disabled={saving || weekLocked}
                    className="px-6 py-3 rounded-2xl font-black text-xs text-[#1e1b4b] bg-gradient-to-r from-[#fea619] to-[#ffb947] hover:from-amber-400 hover:to-amber-400 shadow-xl shadow-[#fea619]/30 transition-all disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed border border-white/60"
                  >
                    {saving ? "Enregistrement..." : weekLocked ? "🔒 Semaine verrouillée" : "💾 Enregistrer toutes les présences de la semaine"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* VUE LISTE RAPIDE (par défaut) */}
        {viewMode === "list" && !weekOverviewOpen && (
          <div className="glass-panel rounded-3xl border border-white/80 shadow-md overflow-hidden animate-fadeIn">
            {/* Barre de statut */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/70 bg-white/50">
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <span className="text-slate-700">
                  {eligibleMembers.length} convié{eligibleMembers.length > 1 ? "s" : ""}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ {presentCount}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  ✕ {markedAbsentCount}
                </span>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {pendingCount} à pointer
                  </span>
                )}
              </div>

              {!isLocked && eligibleMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Tous présents
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Tous absents
                  </button>
                  <button
                    onClick={() => {
                      setCurrentIndex(0);
                      setViewMode("wizard");
                    }}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#1e1b4b] text-white hover:bg-[#312e81] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">swipe_right</span>
                    Mode pas-à-pas
                  </button>
                </div>
              )}
            </div>

            {isLocked && (
              <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200 text-xs font-bold text-amber-900">
                🔒 Délai de 7 jours expiré — liste en lecture seule.
              </div>
            )}

            {/* Grille : 2 à 3 colonnes pour éviter une liste interminable */}
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
              {eligibleMembers.map((member, idx) => {
                const isNewcomer = member.status === "new";
                const prevIsNewcomer = idx > 0 && eligibleMembers[idx - 1].status === "new";
                const showSectionBreak = !isNewcomer && idx > 0 && prevIsNewcomer;
                const state = attendanceState[member.id];
                return (
                  <React.Fragment key={member.id}>
                    {showSectionBreak && (
                      <div className="col-span-full border-t border-slate-200 pt-2 mt-1">
                        <span className="text-[10px] font-label-caps font-extrabold text-slate-500 uppercase tracking-wider">
                          Membres Confirmés
                        </span>
                      </div>
                    )}
                    {idx === 0 && isNewcomer && (
                      <div className="col-span-full pb-1">
                        <span className="text-[10px] font-label-caps font-extrabold text-emerald-700 uppercase tracking-wider">
                          Nouvelles Âmes ({eligibleMembers.filter(m => m.status === "new").length})
                        </span>
                      </div>
                    )}
                  <div
                    className={`rounded-2xl border p-2.5 transition-colors ${
                      state === true
                        ? "bg-emerald-50/50 border-emerald-200"
                        : state === false
                        ? "bg-rose-50/50 border-rose-200"
                        : "bg-white/70 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-white text-[10px] font-black flex items-center justify-center">
                        {member.first_name[0]}
                        {member.last_name[0]}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-[#1e1b4b] truncate flex items-center gap-1">
                          <span className="truncate">
                            {member.first_name} {member.last_name}
                          </span>
                          {member.status === "new" && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {member.consecutive_sundays_present}/4
                            </span>
                          )}
                          {member.status === "absent_to_relaunch" && <span title="À relancer">⚠️</span>}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 truncate">
                          {member.phone || "Pas de téléphone"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleQuickSet(member.id, true)}
                          disabled={isLocked}
                          title="Présent"
                          className={`w-8 h-8 rounded-lg text-xs font-black border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                            state === true
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-300 border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
                          }`}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleQuickSet(member.id, false)}
                          disabled={isLocked}
                          title="Absent"
                          className={`w-8 h-8 rounded-lg text-xs font-black border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                            state === false
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-300 border-slate-200 hover:border-rose-400 hover:text-rose-600"
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {state === false && (
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="Motif (facultatif)..."
                        value={absenceReasons[member.id] || ""}
                        onChange={(e) => setAbsenceReasons({ ...absenceReasons, [member.id]: e.target.value })}
                        className="mt-2 w-full px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-[11px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                      />
                    )}
                  </div>
                  </React.Fragment>
                );
              })}

              {eligibleMembers.length === 0 && (
                <div className="col-span-full px-5 py-14 text-center text-xs font-semibold text-slate-400">
                  Aucun fidèle convié à ce programme.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Barre d'enregistrement collée en bas : plus besoin de scroller pour valider */}
        {viewMode === "list" && !weekOverviewOpen && eligibleMembers.length > 0 && (
          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              disabled={saving || isLocked}
              className="px-6 py-3 rounded-2xl font-black text-xs text-[#1e1b4b] bg-gradient-to-r from-[#fea619] to-[#ffb947] hover:from-amber-400 hover:to-amber-400 shadow-xl shadow-[#fea619]/30 transition-all disabled:opacity-40 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed border border-white/60"
            >
              {saving ? "Enregistrement..." : `💾 Enregistrer l'appel (${presentCount + markedAbsentCount}/${eligibleMembers.length})`}
            </button>
          </div>
        )}

        {/* VUE PAS-À-PAS (compacte) */}
        {viewMode === "wizard" && activeMember && (
          <div className="glass-panel rounded-3xl border border-white/80 shadow-md overflow-hidden animate-fadeIn max-w-xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70 bg-white/50">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-8 h-8 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                ←
              </button>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  {currentIndex + 1} / {eligibleMembers.length}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1e1b4b] to-[#fea619] transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / eligibleMembers.length) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setViewMode("list")}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Quitter
              </button>
            </div>

            {/* Fidèle */}
            <div className="px-5 py-5 flex items-center gap-3.5">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-white text-sm font-black flex items-center justify-center shadow-md">
                {activeMember.first_name[0]}
                {activeMember.last_name[0]}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-headline-md font-extrabold text-[#1e1b4b] tracking-tight truncate">
                  {activeMember.first_name} {activeMember.last_name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {activeMember.phone || "Pas de téléphone"}
                  </span>
                  {activeMember.status === "new" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {activeMember.consecutive_sundays_present >= 4
                        ? "✨ Intégré"
                        : `✨ Nouveau ${activeMember.consecutive_sundays_present}/4`
                      }
                    </span>
                  )}
                  {activeMember.status === "absent_to_relaunch" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      ⚠️ À relancer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleWizardToggle(activeMember.id, true)}
                className={`py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  attendanceState[activeMember.id] === true
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25"
                    : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <span className="text-base">✓</span> Présent
              </button>
              <button
                onClick={() => handleWizardToggle(activeMember.id, false)}
                className={`py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  attendanceState[activeMember.id] === false
                    ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25"
                    : "bg-white text-rose-800 border-rose-200 hover:bg-rose-50"
                }`}
              >
                <span className="text-base">✕</span> Absent
              </button>
            </div>

            {/* Motif d'absence (dimanche uniquement) */}
            {attendanceState[activeMember.id] === false && (
              <div className="px-5 pb-5 space-y-2.5 animate-fadeIn">
                <div className="flex flex-wrap gap-1.5">
                  {["Maladie", "Voyage", "Travail", "Imprévu familial", "Non joignable"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAbsenceReasons({ ...absenceReasons, [activeMember.id]: chip })}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-rose-800 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Motif de l'absence..."
                    value={absenceReasons[activeMember.id] || ""}
                    onChange={(e) => setAbsenceReasons({ ...absenceReasons, [activeMember.id]: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                  />
                  <button
                    type="button"
                    onClick={advanceWizard}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

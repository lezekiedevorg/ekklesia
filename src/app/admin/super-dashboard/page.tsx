"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlobalKPIs } from "./components/GlobalKPIs";
import { OrgTree } from "./components/OrgTree";
import { WeekSummary } from "./components/WeekSummary";
import { DepartmentGrid } from "./components/DepartmentGrid";
import { AlertsPanel } from "./components/AlertsPanel";
import { ComparisonTab } from "./components/ComparisonTab";
import { EvolutionTab } from "./components/EvolutionTab";
import { getProgramsClient } from "@/lib/utils/programs-data";
import { PROGRAM_DEFINITIONS, ProgramDefinition } from "@/lib/constants/programs";

interface GlobalStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisPeriod: number;
  totalShepherds: number;
  totalGroups: number;
  totalDepartments: number;
  attendanceByProgram: Record<string, number>;
  disciplineScores: { prayer: number; meditation: number; evangelism: number; fasting: number };
  reportSubmissionRate: number;
  alertCount: number;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  member_count: number;
  leader?: { first_name: string; last_name: string } | null;
}

type Tab = "overview" | "comparison" | "evolution";
type Mode = "day" | "week" | "month";

function isoDaysAgo(days: number) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}
const TODAY = new Date().toISOString().split("T")[0];

export default function SuperDashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [mode, setMode] = useState<Mode>("week");
  const [start, setStart] = useState(isoDaysAgo(7));
  const [end, setEnd] = useState(TODAY);

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programList, setProgramList] = useState<ProgramDefinition[]>(PROGRAM_DEFINITIONS);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const granularity: "weekly" | "monthly" = mode === "month" ? "monthly" : "weekly";

  function applyMode(m: Mode) {
    setMode(m);
    if (m === "day") setStart(TODAY);
    else if (m === "week") setStart(isoDaysAgo(7));
    else setStart(isoDaysAgo(30));
    setEnd(TODAY);
  }

  useEffect(() => {
    if (tab === "overview") loadOverview();
  }, [tab, start, end]);

  async function loadOverview() {
    setLoading(true);
    try {
      const [membersRes, shepherdsRes, groupsRes, deptsRes, attendanceRes, activitiesRes, reportsRes, alertsRes] =
        await Promise.all([
          supabase.from("members").select("id, status", { count: "exact" }).is("archived_at", null),
          supabase.from("profiles").select("id", { count: "exact" }).eq("role", "shepherd"),
          supabase.from("groups").select("id", { count: "exact" }),
          supabase.from("departments").select("*, member_departments(count)").eq("is_active", true),
          supabase.from("attendance").select("member_id, program_type, is_present").gte("date", start).lte("date", end),
          supabase.from("shepherd_activities").select("*").gte("week_start_date", start).lte("week_start_date", end),
          supabase.from("weekly_reports").select("id, status").gte("report_date", start).lte("report_date", end),
          supabase.from("members").select("id").is("archived_at", null).or("consecutive_absences.gte.2,status.eq.absent_to_relaunch"),
        ]);

      const totalMembers = membersRes.count || 0;
      const totalShepherds = shepherdsRes.count || 0;
      const totalGroups = groupsRes.count || 0;

      const progList = await getProgramsClient();
      setProgramList(progList);
      const attendanceByProgram: Record<string, number> = {};
      for (const prog of progList) {
        const progAtt = (attendanceRes.data || []).filter((a) => a.program_type === prog.id);
        const present = progAtt.filter((a) => a.is_present).length;
        attendanceByProgram[prog.id] = progAtt.length > 0 ? Math.round((present / progAtt.length) * 100) : 0;
      }

      const activities = activitiesRes.data || [];
      const disciplineScores = {
        prayer: activities.length > 0 ? Math.round((activities.filter((a) => a.prayer_q_done || a.daily_prayer_done).length / activities.length) * 100) : 0,
        meditation: activities.length > 0 ? Math.round((activities.filter((a) => a.daily_meditation_done || a.bible_study_q_done).length / activities.length) * 100) : 0,
        evangelism: activities.length > 0 ? Math.round((activities.filter((a) => a.evangelization_done || a.evangelism_q_done).length / activities.length) * 100) : 0,
        fasting: activities.length > 0 ? Math.round((activities.filter((a) => a.fasting_q_done).length / activities.length) * 100) : 0,
      };

      setStats({
        totalMembers,
        activeMembers: totalMembers,
        newMembersThisPeriod: 0,
        totalShepherds,
        totalGroups,
        totalDepartments: (deptsRes.data || []).length,
        attendanceByProgram,
        disciplineScores,
        reportSubmissionRate: totalShepherds > 0 ? Math.round(((reportsRes.data || []).length / totalShepherds) * 100) : 0,
        alertCount: (alertsRes.data || []).length,
      });

      setDepartments(
        (deptsRes.data || []).map((d: any) => ({ ...d, member_count: d.member_departments?.[0]?.count || 0 }))
      );
    } catch (err) {
      console.error("Erreur de chargement du dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Vue globale", icon: "dashboard" },
    { id: "comparison", label: "Comparaison", icon: "compare_arrows" },
    { id: "evolution", label: "Évolution", icon: "trending_up" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-20 font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="text-xs font-extrabold uppercase tracking-widest text-[#fea619] flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#fea619]"></span>
            <span>VUE GLOBALE · CENTRE DE COMMANDEMENT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1E1B4B] tracking-tight">Centre de Commandement</h1>
          <p className="text-sm text-[#6E6D79] font-medium max-w-xl leading-relaxed mt-1">
            KPIs, comparaisons et évolution de l&apos;église — sur la période de votre choix.
          </p>
        </div>

        {/* Tabs + Period selector */}
        <div className="glass-panel p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  tab === t.id ? "bg-[#1E1B4B] text-white shadow-md" : "bg-white/60 text-[#6E6D79] hover:bg-white border border-slate-100"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([
              { m: "day" as const, label: "Jour" },
              { m: "week" as const, label: "Semaine" },
              { m: "month" as const, label: "Mois" },
            ]).map((p) => (
              <button
                key={p.m}
                onClick={() => applyMode(p.m)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === p.m ? "bg-[#3E8EED] text-white shadow-sm" : "bg-white/60 text-[#6E6D79] border border-slate-100 hover:bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
            <span className="material-symbols-outlined text-sm text-[#6E6D79] ml-1">calendar_today</span>
            <input
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#3E8EED]"
            />
            <span className="text-xs text-[#6E6D79]">→</span>
            <input
              type="date"
              value={end}
              min={start}
              max={TODAY}
              onChange={(e) => setEnd(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#3E8EED]"
            />
          </div>
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          loading ? (
            <div className="text-sm text-[#6E6D79] px-1">Chargement du tableau de bord…</div>
          ) : (
            <div className="space-y-6">
              {stats && <GlobalKPIs stats={stats} />}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1"><OrgTree /></div>
                <div className="lg:col-span-2">{stats && <WeekSummary attendance={stats.attendanceByProgram} programs={programList} />}</div>
              </div>
              <DepartmentGrid departments={departments} />
              <AlertsPanel alertCount={stats?.alertCount || 0} />
            </div>
          )
        )}

        {tab === "comparison" && <ComparisonTab start={start} end={end} />}
        {tab === "evolution" && <EvolutionTab start={start} end={end} granularity={granularity} />}
      </main>
    </div>
  );
}

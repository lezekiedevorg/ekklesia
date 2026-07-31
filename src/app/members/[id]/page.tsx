import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMemberStats, getMemberAttendanceTrend } from "@/lib/utils/stats";
import MemberStatsKPIs from "@/components/members/MemberStatsKPIs";
import MemberAttendanceChart from "@/components/members/MemberAttendanceChart";
import MemberProgramBars from "@/components/members/MemberProgramBars";
import PeriodSelector from "@/components/members/PeriodSelector";
import MemberRegularityBadge from "@/components/members/MemberRegularityBadge";

function getDefaultPeriod() {
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
  return {
    from: start.toISOString().split("T")[0],
    to: end.toISOString().split("T")[0],
  };
}

export default async function MemberStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, phone, status, current_class, archived_at, shepherd_id")
    .eq("id", id)
    .single();

  if (error || !member) notFound();

  if (member.archived_at) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-28 font-sans">
        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Retour à la liste des fidèles
          </Link>

          <div className="glass-panel p-10 rounded-3xl shadow-sm text-center">
            <span className="material-symbols-outlined text-[48px] text-amber-400 block mb-3">
              archive
            </span>
            <h2 className="text-xl font-headline-md font-extrabold text-slate-900 mb-2">
              Membre archivé
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Les statistiques ne sont pas disponibles pour les membres archivés.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const defaults = getDefaultPeriod();
  const from = sp.from || defaults.from;
  const to = sp.to || defaults.to;
  const period = { start: from, end: to };

  // Auto granularity: week if ≤ 6 months, month otherwise
  const daysDiff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / (24 * 60 * 60 * 1000));
  const granularity = daysDiff <= 180 ? "week" : "month";

  const [stats, trend] = await Promise.all([
    getMemberStats(id, period),
    getMemberAttendanceTrend(id, from, to, granularity),
  ]);

  const shepherdRes = member.shepherd_id
    ? await supabase.from("profiles").select("first_name, last_name").eq("id", member.shepherd_id).single()
    : null;
  const shepherdName = shepherdRes?.data
    ? `${shepherdRes.data.first_name} ${shepherdRes.data.last_name}`
    : null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-28 font-sans">
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-700 transition-colors mb-4 relative z-10"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Retour à la liste des fidèles
          </Link>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3 border border-[#fea619]/40 shadow-xs">
                <span className="material-symbols-outlined text-[16px] text-[#fea619]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  analytics
                </span>
                <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">
                  Statistiques individuelles
                </span>
              </div>
              <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
                {member.first_name} {member.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {shepherdName && (
                  <span className="text-xs font-semibold text-slate-500">
                    Berger : {shepherdName}
                  </span>
                )}
                <MemberRegularityBadge level={stats.regularityLevel} />
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <Suspense>
          <PeriodSelector from={from} to={to} basePath={`/members/${id}`} />
        </Suspense>

        {/* KPI Cards */}
        <MemberStatsKPIs stats={stats} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MemberAttendanceChart trend={trend} />
          <MemberProgramBars programs={stats.byProgram} />
        </div>
      </main>
    </div>
  );
}

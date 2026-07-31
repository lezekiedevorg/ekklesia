import type { MemberStats } from "@/lib/utils/stats";
import MemberRegularityBadge from "./MemberRegularityBadge";

export default function MemberStatsKPIs({ stats }: { stats: MemberStats }) {
  const kpis = [
    {
      icon: "percent",
      label: "Taux de présence",
      value: `${stats.overallAttendanceRate}%`,
      color: stats.overallAttendanceRate >= 75 ? "text-emerald-700" : stats.overallAttendanceRate >= 50 ? "text-amber-700" : "text-rose-700",
      bg: stats.overallAttendanceRate >= 75 ? "bg-emerald-50/80 border-emerald-200/60" : stats.overallAttendanceRate >= 50 ? "bg-amber-50/80 border-amber-200/60" : "bg-rose-50/80 border-rose-200/60",
    },
    {
      icon: "verified",
      label: "Régularité",
      custom: <MemberRegularityBadge level={stats.regularityLevel} />,
      bg: "bg-slate-50/80 border-slate-200/60",
    },
    {
      icon: "event_available",
      label: "Semaines actives",
      value: `${stats.activeWeeksCount} / ${stats.totalWeeksCount}`,
      sub: "semaines",
      color: "text-[#1e1b4b]",
      bg: "bg-indigo-50/80 border-indigo-200/60",
    },
    {
      icon: "event",
      label: "Dernière venue",
      value: stats.lastSeenDate
        ? new Date(stats.lastSeenDate).toLocaleDateString("fr-FR")
        : "Aucune",
      color: "text-slate-800",
      bg: "bg-slate-50/80 border-slate-200/60",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className={`glass-panel p-5 rounded-3xl shadow-sm border ${kpi.bg} flex flex-col items-center text-center gap-2`}
        >
          <span className="material-symbols-outlined text-[24px] text-slate-400">
            {kpi.icon}
          </span>
          <span className="text-[10px] font-label-caps font-extrabold text-slate-500 uppercase tracking-wider">
            {kpi.label}
          </span>
          {kpi.custom ? (
            kpi.custom
          ) : (
            <span className={`text-2xl font-black font-stat-mono ${kpi.color}`}>
              {kpi.value}
              {kpi.sub && (
                <span className="text-xs font-bold text-slate-400 ml-1">{kpi.sub}</span>
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

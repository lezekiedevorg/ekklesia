interface GlobalKPIsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisPeriod: number;
    totalShepherds: number;
    totalGroups: number;
    totalDepartments: number;
    attendanceByProgram: Record<string, number>;
    disciplineScores: { prayer: number; meditation: number; evangelism: number; fasting: number };
    reportSubmissionRate: number;
  };
}

export function GlobalKPIs({ stats }: GlobalKPIsProps) {
  const avgAttendance = Math.round(
    Object.values(stats.attendanceByProgram).reduce((a, b) => a + b, 0) /
      Math.max(Object.values(stats.attendanceByProgram).length, 1)
  );

  const kpis = [
    { label: "Membres", value: stats.totalMembers, icon: "group", color: "text-[#3E8EED]" },
    { label: "Nouvelles Âmes", value: stats.newMembersThisPeriod, icon: "person_add", color: "text-[#10B981]" },
    { label: "Bergers", value: stats.totalShepherds, icon: "church", color: "text-[#E8912F]" },
    { label: "Groupes", value: stats.totalGroups, icon: "diversity_3", color: "text-[#A16EFF]" },
    { label: "Départements", value: stats.totalDepartments, icon: "apartment", color: "text-[#53B064]" },
    { label: "Présence moy.", value: `${avgAttendance}%`, icon: "monitoring", color: "text-[#EF4444]" },
    { label: "Rapports soumis", value: `${stats.reportSubmissionRate}%`, icon: "assignment", color: "text-[#F59E0B]" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="glass-panel rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl bg-white/80 ${kpi.color}`}>
              <span className="material-symbols-outlined text-lg">{kpi.icon}</span>
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E1B4B] tracking-tight">{kpi.value}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6D79] mt-1">{kpi.label}</div>
        </div>
      ))}
    </div>
  );
}

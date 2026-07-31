"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PROGRAM_DEFINITIONS } from "@/lib/constants/programs";
import type { AttendanceTrendPoint } from "@/lib/utils/stats";

const COLORS: Record<string, string> = {
  sunday_service: "#f59e0b",
  tuesday_class: "#3b82f6",
  wednesday_class: "#8b5cf6",
  thursday_online: "#06b6d4",
  friday_service: "#ef4444",
};

function formatPeriod(period: string): string {
  if (period.includes("W")) return period;
  if (period.length === 7) {
    const [y, m] = period.split("-");
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    return `${months[parseInt(m) - 1]} ${y}`;
  }
  const d = new Date(period);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function MemberAttendanceChart({
  trend,
}: {
  trend: AttendanceTrendPoint[];
}) {
  if (trend.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-3xl shadow-sm text-center">
        <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-2">
          show_chart
        </span>
        <p className="text-sm font-bold text-slate-400">
          Aucune donnée de présence sur cette période
        </p>
      </div>
    );
  }

  // Build chart data: each point has { period, sunday_service, tuesday_class, ... }
  const data = trend.map((point) => ({
    period: formatPeriod(point.period),
    ...point.programs,
  }));

  // Only show programs that have data
  const programsWithData = PROGRAM_DEFINITIONS.filter((prog) =>
    trend.some((point) => point.programs[prog.id] !== undefined)
  );

  return (
    <div className="glass-panel p-6 rounded-3xl shadow-sm">
      <h3 className="text-xs font-label-caps font-extrabold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-[#fea619]">
          show_chart
        </span>
        Évolution de la présence
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              fontSize: "12px",
              fontWeight: 600,
            }}
            formatter={(value, name) => {
              const prog = PROGRAM_DEFINITIONS.find((p) => p.id === String(name));
              return [`${value}%`, prog ? `${prog.icon} ${prog.label}` : name];
            }}
          />
          <Legend
            formatter={(value: string) => {
              const prog = PROGRAM_DEFINITIONS.find((p) => p.id === value);
              return prog ? `${prog.icon} ${prog.label}` : value;
            }}
            wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "8px" }}
          />
          {programsWithData.map((prog) => (
            <Line
              key={prog.id}
              type="monotone"
              dataKey={prog.id}
              stroke={COLORS[prog.id] || "#64748b"}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

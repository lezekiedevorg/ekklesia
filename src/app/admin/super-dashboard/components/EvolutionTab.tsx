"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TrendPoint {
  date: string;
  value: number;
}

export function EvolutionTab({
  start,
  end,
  granularity,
}: {
  start: string;
  end: string;
  granularity: "weekly" | "monthly";
}) {
  const [memberGrowth, setMemberGrowth] = useState<TrendPoint[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<TrendPoint[]>([]);
  const [newcomerGrowth, setNewcomerGrowth] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [granularity, start, end]);

  async function loadData() {
    setLoading(true);
    const startD = new Date(start);
    const end_ = new Date(end);
    const points: TrendPoint[] = [];
    const attPoints: TrendPoint[] = [];
    const newcomerPoints: TrendPoint[] = [];

    const current = new Date(startD);
    let guard = 0;
    while (current <= end_ && guard < 60) {
      guard++;
      const dateStr = current.toISOString().split("T")[0];

      const memberRes = await supabase
        .from("members")
        .select("id", { count: "exact" })
        .is("archived_at", null)
        .lte("created_at", dateStr + "T23:59:59");

      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const attRes = await supabase
        .from("attendance")
        .select("is_present")
        .gte("date", weekStart.toISOString().split("T")[0])
        .lte("date", weekEnd.toISOString().split("T")[0]);

      const attData = attRes.data || [];
      const attPct = attData.length > 0 ? Math.round((attData.filter((a) => a.is_present).length / attData.length) * 100) : 0;

      const newcomerRes = await supabase
        .from("members")
        .select("id", { count: "exact" })
        .eq("status", "new")
        .gte("created_at", weekStart.toISOString().split("T")[0])
        .lte("created_at", weekEnd.toISOString().split("T")[0] + "T23:59:59");

      points.push({ date: dateStr, value: memberRes.count || 0 });
      attPoints.push({ date: dateStr, value: attPct });
      newcomerPoints.push({ date: dateStr, value: newcomerRes.count || 0 });

      if (granularity === "weekly") current.setDate(current.getDate() + 7);
      else current.setMonth(current.getMonth() + 1);
    }

    setMemberGrowth(points);
    setAttendanceTrend(attPoints);
    setNewcomerGrowth(newcomerPoints);
    setLoading(false);
  }

  function renderLineChart(data: TrendPoint[], color: string, label: string, suffix = "") {
    if (data.length === 0) return null;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const minVal = Math.min(...data.map((d) => d.value));
    const range = Math.max(maxVal - minVal, 1);
    const width = 600, height = 200, padding = 40;
    const pts = data.map((d, i) => ({
      x: padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2),
      y: height - padding - ((d.value - minVal) / range) * (height - padding * 2),
      date: d.date,
      value: d.value,
    }));
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return (
      <div className="glass-panel rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1E1B4B] mb-4">{label}</h3>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = height - padding - pct * (height - padding * 2);
            const val = Math.round(minVal + pct * range);
            return (
              <g key={pct}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
                <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6E6D79">{val}{suffix}</text>
              </g>
            );
          })}
          <path d={`${pathD} L ${pts[pts.length - 1].x} ${height - padding} L ${pts[0].x} ${height - padding} Z`} fill={`url(#grad-${label})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          ))}
          {pts.length <= 12 && pts.map((p, i) => (
            <text key={`d-${i}`} x={p.x} y={height - 8} textAnchor="middle" fontSize="9" fill="#6E6D79">{p.date.slice(5)}</text>
          ))}
        </svg>
      </div>
    );
  }

  if (loading) return <div className="text-sm text-[#6E6D79] px-1">Chargement des courbes…</div>;

  return (
    <div className="space-y-6">
      {renderLineChart(memberGrowth, "#3E8EED", "Croissance des membres", "")}
      {renderLineChart(newcomerGrowth, "#10B981", "Nouvelles Âmes par Période", "")}
      {renderLineChart(attendanceTrend, "#53B064", "Tendance de présence", "%")}
    </div>
  );
}

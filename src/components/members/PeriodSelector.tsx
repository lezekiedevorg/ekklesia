"use client";

import { useRouter, useSearchParams } from "next/navigation";

export interface PeriodPreset {
  label: string;
  days: number;
}

const PRESETS: PeriodPreset[] = [
  { label: "1 mois", days: 30 },
  { label: "3 mois", days: 90 },
  { label: "6 mois", days: 180 },
  { label: "1 an", days: 365 },
];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (24 * 60 * 60 * 1000));
}

export default function PeriodSelector({
  from,
  to,
  basePath,
}: {
  from: string;
  to: string;
  basePath: string;
}) {
  const router = useRouter();

  const setRange = (start: string, end: string) => {
    router.push(`${basePath}?from=${start}&to=${end}`);
  };

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setRange(formatDate(start), formatDate(end));
  };

  const activeDays = daysBetween(from, to);

  return (
    <div className="glass-panel p-5 rounded-3xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="text-xs font-label-caps font-extrabold text-slate-500 uppercase tracking-wider shrink-0">
          Période
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => {
            const isActive = Math.abs(activeDays - preset.days) <= 3;
            return (
              <button
                key={preset.days}
                onClick={() => setPreset(preset.days)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-md scale-[1.02] border border-[#fea619]/30"
                    : "bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs font-bold text-slate-400">du</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setRange(e.target.value, to)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
          <span className="text-xs font-bold text-slate-400">au</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setRange(from, e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

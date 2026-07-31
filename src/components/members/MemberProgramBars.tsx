import type { MemberProgramStat } from "@/lib/utils/stats";

function getBarColor(rate: number, eligible: boolean): string {
  if (!eligible) return "bg-slate-200";
  if (rate >= 75) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function getTextColor(rate: number, eligible: boolean): string {
  if (!eligible) return "text-slate-400";
  if (rate >= 75) return "text-emerald-700";
  if (rate >= 50) return "text-amber-700";
  return "text-rose-700";
}

export default function MemberProgramBars({
  programs,
}: {
  programs: MemberProgramStat[];
}) {
  return (
    <div className="glass-panel p-6 rounded-3xl shadow-sm">
      <h3 className="text-xs font-label-caps font-extrabold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-[#fea619]">
          bar_chart
        </span>
        Présence par programme
      </h3>

      <div className="space-y-4">
        {programs.map((prog) => (
          <div key={prog.programId} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{prog.icon}</span>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {prog.label}
                </span>
                {!prog.eligible && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    Non éligible
                  </span>
                )}
              </div>
              <span
                className={`text-sm font-black font-stat-mono shrink-0 ${getTextColor(prog.rate, prog.eligible)}`}
              >
                {prog.eligible ? `${prog.rate}%` : "—"}
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(prog.rate, prog.eligible)}`}
                style={{ width: prog.eligible ? `${prog.rate}%` : "0%" }}
              />
            </div>

            {prog.eligible && (
              <div className="text-[10px] font-medium text-slate-400">
                {prog.presentCount} / {prog.totalCount} présences
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

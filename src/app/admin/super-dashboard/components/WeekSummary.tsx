import { ProgramDefinition } from "@/lib/constants/programs";

interface WeekSummaryProps {
  attendance: Record<string, number>;
  programs?: ProgramDefinition[];
}

const PROGRAM_LABELS: Record<string, { label: string; day: string }> = {
  sunday_service: { label: "Dimanche", day: "Dim" },
  tuesday_class: { label: "Mardi", day: "Mar" },
  wednesday_class: { label: "Mercredi", day: "Mer" },
  thursday_online: { label: "Jeudi", day: "Jeu" },
  friday_service: { label: "Vendredi", day: "Ven" },
};

function getBarColor(pct: number) {
  if (pct >= 75) return "bg-[#53B064]";
  if (pct >= 50) return "bg-[#E8912F]";
  return "bg-[#EF4444]";
}

export function WeekSummary({ attendance, programs: programDefs }: WeekSummaryProps) {
  const programs = Object.entries(attendance);
  const labelFor = (key: string) => {
    const def = programDefs?.find((p) => p.id === key);
    if (def) return { label: def.label, day: def.label.split(" ")[0].slice(0, 3) };
    return PROGRAM_LABELS[key] || { label: key, day: key.slice(0, 3) };
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1E1B4B]">
          Présence par programme
        </h3>
      </div>

      <div className="space-y-4">
        {programs.map(([key, pct]) => {
          const info = labelFor(key);
          return (
            <div key={key} className="flex items-center gap-4">
              <div className="w-16 text-center">
                <div className="text-xs font-bold text-[#1E1B4B]">{info.day}</div>
                <div className="text-[10px] text-[#6E6D79]">{info.label}</div>
              </div>
              <div className="flex-1 h-7 bg-white/60 rounded-full overflow-hidden border border-slate-100">
                <div
                  className={`h-full ${getBarColor(pct)} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-right">
                <span className="text-sm font-black text-[#1E1B4B]">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#53B064]"></div>
          <span className="text-[10px] font-bold text-[#6E6D79]">≥75%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E8912F]"></div>
          <span className="text-[10px] font-bold text-[#6E6D79]">50-74%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
          <span className="text-[10px] font-bold text-[#6E6D79]">&lt;50%</span>
        </div>
      </div>
    </div>
  );
}

import type { RegularityLevel } from "@/lib/utils/stats";

const CONFIG: Record<RegularityLevel, { label: string; icon: string; bg: string; text: string; border: string }> = {
  regular: {
    label: "Régulier",
    icon: "check_circle",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  moderate: {
    label: "Modéré",
    icon: "schedule",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  irregular: {
    label: "Irrégulier",
    icon: "trending_down",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  absent: {
    label: "Absent",
    icon: "warning",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
  },
};

export default function MemberRegularityBadge({ level }: { level: RegularityLevel }) {
  const cfg = CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border shadow-2xs ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}

import Link from "next/link";

interface AlertsPanelProps {
  alertCount: number;
}

export function AlertsPanel({ alertCount }: AlertsPanelProps) {
  if (alertCount === 0) return null;

  return (
    <Link
      href="/admin/alerts"
      className="glass-panel rounded-2xl p-5 shadow-sm border-l-4 border-[#EF4444] bg-[#FEF2F2]/30 hover:bg-[#FEF2F2]/60 transition-all block"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#EF4444]/10">
          <span className="material-symbols-outlined text-xl text-[#EF4444]">warning</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#1E1B4B]">Alertes actives</div>
          <div className="text-xs text-[#6E6D79]">
            {alertCount} membre{alertCount > 1 ? "s" : ""} en alerte (absences répétées ou statut &quot;à relancer&quot;)
          </div>
        </div>
        <div className="text-2xl font-black text-[#EF4444]">{alertCount}</div>
      </div>
    </Link>
  );
}

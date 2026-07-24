import Link from "next/link";

interface DepartmentGridProps {
  departments: {
    id: string;
    name: string;
    icon: string;
    member_count: number;
  }[];
}

export function DepartmentGrid({ departments }: DepartmentGridProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1E1B4B]">
          Départements actifs
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {departments.map((dept) => (
          <Link
            key={dept.id}
            href={`/admin/departments/${dept.id}`}
            className="p-4 rounded-xl bg-white/60 border border-slate-100 hover:bg-white hover:shadow-md transition-all text-center group"
          >
            <div className="text-3xl mb-2">{dept.icon}</div>
            <div className="text-xs font-bold text-[#1E1B4B] group-hover:text-[#3E8EED] transition-colors">
              {dept.name}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[11px] text-[#6E6D79]">
              <span className="material-symbols-outlined text-sm">group</span>
              <span>{dept.member_count}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

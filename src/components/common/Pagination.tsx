'use client';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  sizes?: number[];
}

// Reusable table pagination + page-size selector (default sizes start at 5).
export default function Pagination({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
  sizes = [5, 10, 20, 50],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs">
      <div className="flex items-center gap-2 text-slate-500 font-medium">
        <span>{from}–{to} sur {total}</span>
        <span className="text-slate-300">·</span>
        <label className="flex items-center gap-1.5">
          <span>Par page</span>
          <select
            value={pageSize}
            onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1); }}
            className="px-2 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-[#3E8EED]"
          >
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current <= 1}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Page précédente"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span className="px-2 font-bold text-[#1e1b4b]">{current} / {totalPages}</span>
        <button
          onClick={() => onPage(current + 1)}
          disabled={current >= totalPages}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Page suivante"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

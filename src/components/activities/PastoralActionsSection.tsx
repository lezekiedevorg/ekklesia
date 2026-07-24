"use client";

import React from "react";
import { SHEPHERD_WORK_ITEMS, SOULS_COUNTERS } from "@/lib/constants/programs";

interface PastoralActionsSectionProps {
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function PastoralActionsSection({ form, setForm }: PastoralActionsSectionProps) {
  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">🤝</span>
          <span>2. Travail du berger</span>
        </h3>
      </div>

      {/* OUI / NON comme sur le rapport papier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SHEPHERD_WORK_ITEMS.map((item) => {
          const done = !!form[item.key];
          return (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl border border-slate-200/70 bg-white/70 flex items-center justify-between gap-3 shadow-2xs"
            >
              <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm truncate">
                {item.icon} {item.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => set(item.key, true)}
                  className={`px-3 h-9 rounded-xl font-black text-[11px] border transition-all cursor-pointer ${
                    done
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-100/80 text-slate-500 border-slate-200/80 hover:bg-white"
                  }`}
                >
                  OUI
                </button>
                <button
                  type="button"
                  onClick={() => set(item.key, false)}
                  className={`px-3 h-9 rounded-xl font-black text-[11px] border transition-all cursor-pointer ${
                    !done
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-slate-100/80 text-slate-500 border-slate-200/80 hover:bg-white"
                  }`}
                >
                  NON
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {form.phone_calls_done && (
        <div>
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
            Nombre d&apos;entretiens téléphoniques
          </label>
          <input
            type="number"
            min="0"
            value={form.phone_calls_count ?? 0}
            onChange={(e) => set("phone_calls_count", Number(e.target.value))}
            className="w-full sm:w-40 bg-slate-50/80 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-black text-[#1e1b4b] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
          />
        </div>
      )}

      {/* Bilan des âmes */}
      <div className="pt-4 border-t border-slate-200/60">
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">Bilan des âmes</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SOULS_COUNTERS.map((c) => (
            <div key={c.key} className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
              <label className="text-[11px] font-black uppercase tracking-tight text-slate-600 block mb-1.5 leading-tight">
                {c.icon} {c.label}
              </label>
              <input
                type="number"
                min="0"
                value={form[c.key] ?? 0}
                onChange={(e) => set(c.key, Number(e.target.value))}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-base font-black text-[#1e1b4b] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

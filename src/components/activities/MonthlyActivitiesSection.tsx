"use client";

import React from "react";
import { MONTHLY_ITEMS } from "@/lib/constants/programs";

interface MonthlyActivitiesSectionProps {
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function MonthlyActivitiesSection({ form, setForm }: MonthlyActivitiesSectionProps) {
  const toggleCheckbox = (key: string) => {
    setForm((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const items = MONTHLY_ITEMS;

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">🗓️</span>
          <span>4. Activités Mensuelles & Chaînes de Prière</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const checked = (form as any)[item.key];
          return (
            <label
              key={item.key}
              onClick={() => toggleCheckbox(item.key)}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 ${
                checked
                  ? "bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-indigo-300/80 text-[#1e1b4b] font-bold shadow-sm scale-[1.01]"
                  : "bg-white/70 border-slate-200/80 text-slate-600 font-medium hover:bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-xs sm:text-sm leading-snug">{item.label}</span>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  checked ? "bg-[#1e1b4b] text-[#fea619]" : "border border-slate-300 bg-white"
                }`}
              >
                {checked && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}


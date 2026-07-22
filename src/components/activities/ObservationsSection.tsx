"use client";

import React from "react";

interface ObservationsSectionProps {
  form: {
    mentoring_theme: string;
    other_observations: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function ObservationsSection({ form, setForm }: ObservationsSectionProps) {
  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5 flex items-center justify-between">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">📝</span>
          <span>5. Thème & Observations</span>
        </h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            ✨ Thème d&apos;encadrement de la semaine :
          </label>
          <input
            type="text"
            placeholder="Ex: La consécration par la prière et la fidélité dans le service..."
            value={form.mentoring_theme}
            onChange={(e) => setForm((prev: any) => ({ ...prev, mentoring_theme: e.target.value }))}
            className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-[#1e1b4b] focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-2xs transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            🕊️ Observations / Requêtes / Difficultés pastorales :
          </label>
          <textarea
            rows={4}
            placeholder="Remarques particulières sur l&apos;état spirituel du troupeau, défis pastoraux, témoignages ou sujets urgents de prière..."
            value={form.other_observations}
            onChange={(e) => setForm((prev: any) => ({ ...prev, other_observations: e.target.value }))}
            className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-[#1e1b4b] focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none shadow-2xs transition-all"
          />
        </div>
      </div>
    </div>
  );
}


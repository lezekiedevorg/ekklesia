"use client";

import React from "react";
import Link from "next/link";

interface ObservationsSectionProps {
  form: {
    mentoring_theme: string;
    other_observations: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  /** Absents du dimanche + motif, repris du pointage — non ressaisis ici. */
  absentees: { name: string; reason: string }[];
}

export function ObservationsSection({ form, setForm, absentees }: ObservationsSectionProps) {
  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5 flex items-center justify-between">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">📝</span>
          <span>5. Observations</span>
        </h3>
      </div>

      {/* Noms des absents et raison — alimenté par le pointage */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="text-xs font-bold text-slate-700">Noms des absents et raison</label>
          <Link href="/attendance" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0">
            Modifier au pointage →
          </Link>
        </div>
        {absentees.length > 0 ? (
          <ul className="rounded-2xl border border-rose-200/80 bg-rose-50/40 divide-y divide-rose-200/60 overflow-hidden">
            {absentees.map((a) => (
              <li key={a.name} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-[#1e1b4b] truncate">{a.name}</span>
                <span className="font-medium text-rose-700 truncate text-right">{a.reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-center text-[11px] font-semibold text-slate-400">
            Aucun absent au culte dominical sur cette semaine.
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          ✨ Thème d&apos;encadrement de la semaine
        </label>
        <input
          type="text"
          placeholder="Ex : La consécration par la prière et la fidélité dans le service..."
          value={form.mentoring_theme}
          onChange={(e) => setForm((prev: any) => ({ ...prev, mentoring_theme: e.target.value }))}
          className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-[#1e1b4b] focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-2xs transition-all"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">🕊️ Autres observations</label>
        <textarea
          rows={4}
          placeholder="Personnes visitées, objets et dates des visites, requêtes, difficultés pastorales, témoignages..."
          value={form.other_observations}
          onChange={(e) => setForm((prev: any) => ({ ...prev, other_observations: e.target.value }))}
          className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-[#1e1b4b] focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none shadow-2xs transition-all"
        />
      </div>
    </div>
  );
}

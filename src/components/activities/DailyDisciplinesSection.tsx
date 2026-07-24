"use client";

import React from "react";
import { QI_DISCIPLINES, YESNO_DISCIPLINES } from "@/lib/constants/programs";

interface DailyDisciplinesSectionProps {
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  selectQI: (qField: string, iField: string, choice: "Q" | "I" | "NONE") => void;
}

export function DailyDisciplinesSection({ form, setForm, selectQI }: DailyDisciplinesSectionProps) {
  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">🕊️</span>
          <span>1. Vie personnelle</span>
        </h3>
        <span className="text-[10px] font-extrabold text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-lg border border-amber-200/80 shadow-2xs self-start sm:self-auto">
          ⚡ Choix exclusif : Q ou I
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QI_DISCIPLINES.map((d) => {
          const isQ = !!form[d.q];
          const isI = !!form[d.i];
          return (
            <div
              key={d.q}
              className="p-3.5 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition-colors flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0">
                <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm block truncate">
                  {d.icon} {d.label}
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate block">{d.hint}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => selectQI(d.q, d.i, isQ ? "NONE" : "Q")}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                    isQ
                      ? "bg-[#1e1b4b] text-[#fea619] border-[#1e1b4b] shadow-md shadow-indigo-950/20"
                      : "bg-slate-100/80 text-slate-500 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  }`}
                  title="Q = Quotidien"
                >
                  Q
                </button>
                <button
                  type="button"
                  onClick={() => selectQI(d.q, d.i, isI ? "NONE" : "I")}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                    isI
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25"
                      : "bg-slate-100/80 text-slate-500 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  }`}
                  title="I = Intermittent"
                >
                  I
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jeûne & Écoute de la parole : simple OUI / NON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {YESNO_DISCIPLINES.map((d) => {
          const done = !!form[d.key];
          return (
            <div
              key={d.key}
              className="p-3.5 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition-colors flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0">
                <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm block truncate">
                  {d.icon} {d.label}
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate block">{d.hint}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setForm((prev: any) => ({ ...prev, [d.key]: true }))}
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
                  onClick={() => setForm((prev: any) => ({ ...prev, [d.key]: false }))}
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

      <div className="pt-1">
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
          Le livre à étudier
        </label>
        <input
          type="text"
          placeholder="Ex : Éphésiens 1 à 3"
          value={form.meditated_book || ""}
          onChange={(e) => setForm((prev: any) => ({ ...prev, meditated_book: e.target.value }))}
          className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1e1b4b] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
        />
      </div>
    </div>
  );
}

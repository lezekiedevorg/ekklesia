"use client";

import React from "react";
import Link from "next/link";
import { ProgramSummaryItem } from "@/types/db";
import { SHEPHERD_ATTENDANCE_ITEMS } from "@/lib/constants/programs";

interface ProgramsPresenceCardProps {
  programsSummary: ProgramSummaryItem[];
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function ProgramsPresenceCard({ programsSummary, form, setForm }: ProgramsPresenceCardProps) {
  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3.5">
        <div>
          <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">👥</span>
            <span>3. Programme d&apos;église</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Votre présence personnelle, puis celle du troupeau calculée depuis vos appels.
          </p>
        </div>
        <Link
          href="/attendance"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-[#1e1b4b] hover:from-[#1e1b4b] hover:to-indigo-900 text-white text-xs font-bold transition-all duration-300 self-start sm:self-auto shrink-0 shadow-md shadow-indigo-950/20 active:scale-95"
        >
          <span>📋 Faire le pointage</span>
          <span>→</span>
        </Link>
      </div>

      {/* Présence personnelle du berger */}
      <div>
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
          Ma présence cette semaine
        </h4>
        <div className="flex flex-wrap gap-2">
          {SHEPHERD_ATTENDANCE_ITEMS.map((item) => {
            const present = !!form[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setForm((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  present
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25"
                    : "bg-white/70 text-slate-500 border-slate-200/80 hover:border-emerald-300"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {programsSummary && programsSummary.length > 0 ? (
          programsSummary.map((prog) => {
            const badgeStyle =
              prog.ratio_pct >= 75
                ? "bg-emerald-100/90 text-emerald-800 border-emerald-300/80"
                : prog.ratio_pct >= 40
                ? "bg-amber-100/90 text-amber-800 border-amber-300/80"
                : "bg-rose-100/90 text-rose-800 border-rose-300/80";

            return (
              <div
                key={prog.program_type}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white/70 hover:bg-white flex flex-col justify-between gap-3 hover:border-indigo-300/80 transition-all duration-300 shadow-2xs hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs sm:text-sm font-bold text-[#1e1b4b] flex items-center gap-2 leading-tight">
                    <span className="text-base shrink-0 p-1 rounded-lg bg-indigo-50/70 border border-indigo-100">{prog.icon}</span>
                    <span>{prog.label}</span>
                  </span>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-lg border shrink-0 ${badgeStyle}`}
                  >
                    {prog.ratio_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-2.5 border-t border-slate-200/60">
                  <span>Présents :</span>
                  <span className="font-black text-[#1e1b4b] text-sm">
                    {prog.present_count}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      / {prog.eligible_count} éligibles
                    </span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-10 text-center text-slate-400 text-xs font-medium bg-white/50 rounded-2xl border border-dashed border-slate-200/80">
            Aucune donnée de présence disponible pour cette semaine.
          </div>
        )}
      </div>
    </div>
  );
}


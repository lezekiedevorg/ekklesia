"use client";

import React from "react";

interface DailyDisciplinesSectionProps {
  form: {
    daily_prayer_q_done: boolean;
    daily_prayer_i_done: boolean;
    bible_reading_q_done: boolean;
    bible_reading_i_done: boolean;
    meditation_q_done: boolean;
    meditation_i_done: boolean;
    meditation_book: string;
    meditation_chapter_start: number | "";
    meditation_chapter_end: number | "";
    evangelism_q_done: boolean;
    evangelism_i_done: boolean;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  selectQI: (qField: string, iField: string, choice: "Q" | "I" | "NONE") => void;
}

export function DailyDisciplinesSection({ form, setForm, selectQI }: DailyDisciplinesSectionProps) {
  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">📅</span>
          <span>1. Disciplines Quotidiennes & Évangélisation</span>
        </h3>
        <span className="text-[10px] font-extrabold text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-lg border border-amber-200/80 shadow-2xs self-start sm:self-auto">
          ⚡ Choix exclusif : Q ou I
        </span>
      </div>

      <div className="space-y-3.5">
        {/* Prière personnelle */}
        <div className="p-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
          <div>
            <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm block">
              🙏 Prière personnelle & en Langue
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Temps d&apos;intimité quotidien avec le Seigneur
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => selectQI("daily_prayer_q_done", "daily_prayer_i_done", form.daily_prayer_q_done ? "NONE" : "Q")}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                form.daily_prayer_q_done
                  ? "bg-[#1e1b4b] text-[#fea619] border-[#1e1b4b] shadow-md shadow-indigo-950/20 scale-[1.03]"
                  : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              Q (Quotidien)
            </button>
            <button
              type="button"
              onClick={() => selectQI("daily_prayer_q_done", "daily_prayer_i_done", form.daily_prayer_i_done ? "NONE" : "I")}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                form.daily_prayer_i_done
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 scale-[1.03]"
                  : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              I (Intermittent)
            </button>
          </div>
        </div>

        {/* Lecture de la Bible */}
        <div className="p-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
          <div>
            <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm block">
              📖 Lecture régulière de la Parole (Bible)
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Plan de lecture biblique suivi de manière fidèle
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => selectQI("bible_reading_q_done", "bible_reading_i_done", form.bible_reading_q_done ? "NONE" : "Q")}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                form.bible_reading_q_done
                  ? "bg-[#1e1b4b] text-[#fea619] border-[#1e1b4b] shadow-md shadow-indigo-950/20 scale-[1.03]"
                  : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              Q (Quotidien)
            </button>
            <button
              type="button"
              onClick={() => selectQI("bible_reading_q_done", "bible_reading_i_done", form.bible_reading_i_done ? "NONE" : "I")}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                form.bible_reading_i_done
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 scale-[1.03]"
                  : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              I (Intermittent)
            </button>
          </div>
        </div>

        {/* Méditation + détails */}
        <div className="p-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition-all duration-300 space-y-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm block">
                🧠 Méditation biblique approfondie
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                S&apos;arrêter sur les passages pour en extraire la révélation
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => selectQI("meditation_q_done", "meditation_i_done", form.meditation_q_done ? "NONE" : "Q")}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                  form.meditation_q_done
                    ? "bg-[#1e1b4b] text-[#fea619] border-[#1e1b4b] shadow-md shadow-indigo-950/20 scale-[1.03]"
                    : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
                }`}
              >
                Q (Quotidien)
              </button>
              <button
                type="button"
                onClick={() => selectQI("meditation_q_done", "meditation_i_done", form.meditation_i_done ? "NONE" : "I")}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                  form.meditation_i_done
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 scale-[1.03]"
                    : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
                }`}
              >
                I (Intermittent)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Livre / Épître</label>
              <input
                type="text"
                placeholder="Ex: Éphésiens"
                value={form.meditation_book}
                onChange={(e) => setForm((prev: any) => ({ ...prev, meditation_book: e.target.value }))}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-[#1e1b4b] mt-1 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Chapitre Début</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={form.meditation_chapter_start}
                onChange={(e) => setForm((prev: any) => ({ ...prev, meditation_chapter_start: e.target.value ? Number(e.target.value) : "" }))}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-[#1e1b4b] mt-1 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Chapitre Fin</label>
              <input
                type="number"
                min="1"
                placeholder="3"
                value={form.meditation_chapter_end}
                onChange={(e) => setForm((prev: any) => ({ ...prev, meditation_chapter_end: e.target.value ? Number(e.target.value) : "" }))}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-[#1e1b4b] mt-1 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Évangélisation */}
        <div className="p-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
          <div>
            <span className="font-extrabold text-[#1e1b4b] text-xs sm:text-sm block">
              📣 Évangélisation personnelle
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Témoignage du salut et annonce de l&apos;Évangile
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => selectQI("evangelism_q_done", "evangelism_i_done", form.evangelism_q_done ? "NONE" : "Q")}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                form.evangelism_q_done
                  ? "bg-[#1e1b4b] text-[#fea619] border-[#1e1b4b] shadow-md shadow-indigo-950/20 scale-[1.03]"
                  : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              Q (Quotidien)
            </button>
            <button
              type="button"
              onClick={() => selectQI("evangelism_q_done", "evangelism_i_done", form.evangelism_i_done ? "NONE" : "I")}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border ${
                form.evangelism_i_done
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 scale-[1.03]"
                  : "bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              I (Intermittent)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


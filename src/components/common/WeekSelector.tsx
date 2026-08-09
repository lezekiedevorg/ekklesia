"use client";

import React, { useRef } from "react";
import { formatWeekIntervalText, getMondayDateStr } from "@/lib/utils/dateFormatter";

interface WeekSelectorProps {
  selectedDate: string;
  onChangeDate: (newDateStr: string) => void;
  className?: string;
  showTodayButton?: boolean;
}

export default function WeekSelector({
  selectedDate,
  onChangeDate,
  className = "",
  showTodayButton = true,
}: WeekSelectorProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onChangeDate(d.toISOString().split("T")[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onChangeDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    onChangeDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className={`inline-flex flex-wrap items-center justify-center bg-white rounded-full p-1 border border-[#c8c5d0]/30 shadow-2xs gap-1 max-w-full ${className}`}>
      <button
        type="button"
        onClick={handlePrevWeek}
        title="Semaine précédente"
        aria-label="Semaine précédente"
        className="min-h-[36px] min-w-[36px] p-2 text-[#47464f] hover:text-[#1e1b4b] transition-colors rounded-full hover:bg-[#f2f4f6] flex items-center justify-center cursor-pointer active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
      </button>

      <div
        onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
        className="px-2.5 sm:px-4 py-1.5 flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-[#f2f4f6]/60 rounded-full transition-colors group min-h-[36px]"
        title="Cliquer pour choisir une date précise"
      >
        <span className="material-symbols-outlined text-[16px] text-[#fea619] group-hover:scale-110 transition-transform">
          calendar_today
        </span>
        <span className="font-label-caps font-bold text-[11px] sm:text-sm text-[#191c1e] whitespace-nowrap">
          {formatWeekIntervalText(selectedDate) || selectedDate}
        </span>
      </div>

      <input
        ref={dateInputRef}
        type="date"
        value={selectedDate}
        onChange={(e) => {
          if (e.target.value) onChangeDate(e.target.value);
        }}
        className="sr-only"
        aria-label="Choisir une date"
      />

      <button
        type="button"
        onClick={handleNextWeek}
        title="Semaine suivante"
        aria-label="Semaine suivante"
        className="min-h-[36px] min-w-[36px] p-2 text-[#47464f] hover:text-[#1e1b4b] transition-colors rounded-full hover:bg-[#f2f4f6] flex items-center justify-center cursor-pointer active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>

      {showTodayButton && (
        <button
          type="button"
          onClick={handleToday}
          title="Revenir à la semaine courante"
          aria-label="Aujourd'hui"
          className="min-h-[36px] ml-1 px-3 py-1.5 rounded-full bg-[#1e1b4b]/5 hover:bg-[#1e1b4b]/10 text-[#1e1b4b] font-label-caps font-bold text-[11px] sm:text-xs transition-colors whitespace-nowrap"
        >
          Aujourd&apos;hui
        </button>
      )}
    </div>
  );
}

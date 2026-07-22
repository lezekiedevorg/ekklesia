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
    <div className={`inline-flex items-center bg-white rounded-full p-1 border border-[#c8c5d0]/30 shadow-2xs ${className}`}>
      <button
        type="button"
        onClick={handlePrevWeek}
        title="Semaine précédente"
        className="p-2 text-[#47464f] hover:text-[#1e1b4b] transition-colors rounded-full hover:bg-[#f2f4f6] flex items-center justify-center cursor-pointer active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
      </button>

      <div
        onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
        className="px-3 md:px-4 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-[#f2f4f6]/60 rounded-full transition-colors group"
        title="Cliquer pour choisir une date précise"
      >
        <span className="material-symbols-outlined text-[16px] text-[#fea619] group-hover:scale-110 transition-transform">
          calendar_today
        </span>
        <span className="font-label-caps font-bold text-xs md:text-sm text-[#191c1e] whitespace-nowrap">
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
        className="p-2 text-[#47464f] hover:text-[#1e1b4b] transition-colors rounded-full hover:bg-[#f2f4f6] flex items-center justify-center cursor-pointer active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>

      {showTodayButton && (
        <button
          type="button"
          onClick={handleToday}
          title="Cette semaine"
          className="ml-1 px-3 py-1.5 rounded-full bg-[#1e1b4b]/5 hover:bg-[#1e1b4b]/10 text-[#1e1b4b] font-label-caps font-bold text-[11px] transition-colors whitespace-nowrap"
        >
          Aujourd&apos;hui
        </button>
      )}
    </div>
  );
}

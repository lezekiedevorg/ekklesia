"use client";

import React from "react";

interface PastoralActionsSectionProps {
  form: {
    pastoral_souls_won: number;
    pastoral_new_contacts: number;
    pastoral_first_timers: number;
    pastoral_home_visits: number;
    pastoral_sick_visits: number;
    pastoral_consolation_visits: number;
    pastoral_followup_calls: number;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function PastoralActionsSection({ form, setForm }: PastoralActionsSectionProps) {
  const updateNumber = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: Number(value) }));
  };

  const fields = [
    { key: "pastoral_souls_won", label: "Âmes gagnées", icon: "✨" },
    { key: "pastoral_new_contacts", label: "Nouveaux contacts", icon: "🌱" },
    { key: "pastoral_first_timers", label: "Premières visites", icon: "👋" },
    { key: "pastoral_followup_calls", label: "Appels de suivi", icon: "📞" },
    { key: "pastoral_home_visits", label: "Visites à domicile", icon: "🏡" },
    { key: "pastoral_sick_visits", label: "Visites malades", icon: "🏥" },
    { key: "pastoral_consolation_visits", label: "Consolation", icon: "🕊️" },
  ];

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      <div className="border-b border-slate-200/60 pb-3.5">
        <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-base shadow-2xs">🤝</span>
          <span>2. Suivi Pastoral & Évangélisation de Terrain</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {fields.map((field) => (
          <div
            key={field.key}
            className="p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/80 transition-all duration-300 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs">{field.icon}</span>
              <label className="text-[11px] font-black uppercase tracking-tight text-slate-600 truncate block">
                {field.label}
              </label>
            </div>
            <input
              type="number"
              min="0"
              value={(form as any)[field.key]}
              onChange={(e) => updateNumber(field.key, e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-base font-black text-[#1e1b4b] focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}


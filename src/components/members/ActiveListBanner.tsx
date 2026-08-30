"use client";

import React from "react";
import { setActiveListId, type NamedList } from "@/lib/storage/namedLists";

interface ActiveListBannerProps {
  list: NamedList;
  onChange: () => void;
}

/**
 * Bandeau sticky affiché en haut de /members quand une liste est active.
 * Indique clairement dans quelle liste les membres cochés seront ajoutés.
 */
export function ActiveListBanner({ list, onChange }: ActiveListBannerProps) {
  const handleQuit = () => {
    setActiveListId(null);
    onChange();
  };

  return (
    <div className="sticky top-2 z-30 mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-lg flex items-center justify-between gap-3 border border-[#fea619]/40">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-[#fea619] shrink-0">
          bookmark
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#fea619]/90">
            Liste active
          </div>
          <div className="font-extrabold text-sm truncate">
            {list.name}{" "}
            <span className="font-semibold text-white/70">
              ({list.memberIds.length} membre{list.memberIds.length > 1 ? "s" : ""})
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={handleQuit}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 border border-white/20"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
        Quitter
      </button>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  isMemberInActiveList,
  subscribeToChanges,
  toggleMemberInActiveList,
} from "@/lib/storage/namedLists";

interface MemberCardCheckboxProps {
  memberId: string;
  /** Notifie le parent que la liste active a changé (pour refresh du bandeau) */
  onChange?: () => void;
}

/**
 * Checkbox flottante affichée en haut à droite de chaque carte membre.
 * Visible UNIQUEMENT si une liste est active. Cocher ajoute/retire le membre
 * de la liste active, avec persistance immédiate en localStorage.
 */
export function MemberCardCheckbox({ memberId, onChange }: MemberCardCheckboxProps) {
  const readChecked = () => isMemberInActiveList(memberId);
  const [checked, setChecked] = useState<boolean>(readChecked);

  useEffect(() => {
    const unsub = subscribeToChanges(() => setChecked(readChecked()));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMemberInActiveList(memberId);
    setChecked(readChecked());
    onChange?.();
  };

  return (
    <button
      onClick={handleToggle}
      title={checked ? "Retirer de la liste active" : "Ajouter à la liste active"}
      className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
        checked
          ? "bg-[#1e1b4b] border-[#1e1b4b] text-[#fea619]"
          : "bg-white/80 border-slate-300 text-transparent hover:border-[#1e1b4b]"
      }`}
    >
      <span className="material-symbols-outlined text-[18px] leading-none">
        check
      </span>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface GroupRow {
  name: string;
  leaderName: string | null;
  shepherds: number;
  color: string;
}

const COLORS = ["bg-[#3E8EED]", "bg-[#A16EFF]", "bg-[#E8912F]"];

export function OrgTree() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [totalShepherds, setTotalShepherds] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const [groupsRes, profilesRes] = await Promise.all([
        supabase.from("groups").select("id, name, leader_id").order("name"),
        supabase.from("profiles").select("id, first_name, last_name, group_id, role"),
      ]);
      const profiles = (profilesRes.data || []) as any[];
      const counts: Record<string, number> = {};
      profiles.forEach((p) => {
        if (p.group_id) counts[p.group_id] = (counts[p.group_id] || 0) + 1;
      });
      const rows = (groupsRes.data || []).map((g: any, i: number) => {
        const leader = profiles.find((p) => p.id === g.leader_id);
        return {
          name: g.name,
          leaderName: leader ? `${leader.first_name} ${leader.last_name}` : null,
          shepherds: counts[g.id] || 0,
          color: COLORS[i % COLORS.length],
        };
      });
      setGroups(rows);
      setTotalShepherds(profiles.filter((p) => p.role === "shepherd").length);
    })();
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1E1B4B]">Organigramme</h3>
        <Link href="/admin/groups" className="p-2 rounded-xl bg-white/80 text-[#3E8EED] hover:bg-white transition-colors" title="Gérer les cellules">
          <span className="material-symbols-outlined text-lg">church</span>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-[#3E8EED]/5 border border-[#3E8EED]/10">
          <div className="font-bold text-sm text-[#1E1B4B]">Pasteur Principal</div>
          <div className="text-[11px] text-[#6E6D79]">Supervise l&apos;ensemble</div>
        </div>

        <div className="ml-4 border-l-2 border-[#3E8EED]/20 pl-4 space-y-2">
          {groups.map((g) => (
            <Link
              key={g.name}
              href="/admin/groups"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-slate-100 hover:bg-white transition-all"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${g.color}`}></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#1E1B4B]">{g.name}</div>
                <div className="text-[11px] text-[#6E6D79] truncate">
                  {g.leaderName || "Aucun responsable"} · {g.shepherds} encadrant{g.shepherds > 1 ? "s" : ""}
                </div>
              </div>
              <span className="material-symbols-outlined text-sm text-slate-300">chevron_right</span>
            </Link>
          ))}
        </div>

        <div className="ml-4 border-l-2 border-[#3E8EED]/20 pl-4">
          <div className="text-[11px] text-[#6E6D79] font-medium">{totalShepherds} bergers au total</div>
        </div>
      </div>
    </div>
  );
}

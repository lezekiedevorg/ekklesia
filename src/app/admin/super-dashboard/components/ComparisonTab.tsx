"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Entity {
  id: string;
  name: string;
  type: "group" | "shepherd" | "department";
}

interface ComparisonRow {
  entity: Entity;
  memberCount: number;
  avgAttendance: number;
  avgDiscipline: number;
  avgScore: number;
}

// Compare groups first (default), then shepherds/departments, over the shared period.
export function ComparisonTab({ start, end }: { start: string; end: string }) {
  const [entityType, setEntityType] = useState<"group" | "shepherd" | "department">("group");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadEntities();
  }, [entityType]);

  useEffect(() => {
    if (selectedIds.length > 0) loadComparison();
    else setRows([]);
  }, [selectedIds, start, end]);

  async function loadEntities() {
    setLoading(true);
    setSelectedIds([]);
    let data: Entity[] = [];
    if (entityType === "group") {
      const res = await supabase.from("groups").select("id, name");
      data = (res.data || []).map((g: any) => ({ id: g.id, name: g.name, type: "group" as const }));
    } else if (entityType === "shepherd") {
      const res = await supabase.from("profiles").select("id, first_name, last_name").eq("role", "shepherd");
      data = (res.data || []).map((s: any) => ({
        id: s.id,
        name: `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Berger",
        type: "shepherd" as const,
      }));
    } else {
      const res = await supabase.from("departments").select("id, name").eq("is_active", true);
      data = (res.data || []).map((d: any) => ({ id: d.id, name: d.name, type: "department" as const }));
    }
    setEntities(data);
    setLoading(false);
  }

  async function loadComparison() {
    setLoading(true);
    const result: ComparisonRow[] = [];

    for (const id of selectedIds) {
      const entity = entities.find((e) => e.id === id);
      if (!entity) continue;

      // Members belong to a group indirectly, through their shepherd (profiles.group_id).
      let memberIds: string[] = [];
      if (entityType === "group") {
        const { data: sh } = await supabase.from("profiles").select("id").eq("group_id", id);
        const shIds = (sh || []).map((s: any) => s.id);
        if (shIds.length > 0) {
          const { data: mem } = await supabase.from("members").select("id").in("shepherd_id", shIds).is("archived_at", null);
          memberIds = (mem || []).map((m: any) => m.id);
        }
      } else if (entityType === "shepherd") {
        const { data: mem } = await supabase.from("members").select("id").eq("shepherd_id", id).is("archived_at", null);
        memberIds = (mem || []).map((m: any) => m.id);
      } else {
        const { data: md } = await supabase.from("member_departments").select("member_id").eq("department_id", id);
        memberIds = (md || []).map((m: any) => m.member_id);
      }
      const memberCount = memberIds.length;

      let avgAttendance = 0;
      if (memberIds.length > 0) {
        const attRes = await supabase
          .from("attendance")
          .select("is_present")
          .gte("date", start)
          .lte("date", end)
          .in("member_id", memberIds);
        const attData = attRes.data || [];
        avgAttendance = attData.length > 0
          ? Math.round((attData.filter((a) => a.is_present).length / attData.length) * 100)
          : 0;
      }

      let avgDiscipline = 0;
      if (entityType === "shepherd") {
        const actRes = await supabase
          .from("shepherd_activities")
          .select("prayer_q_done, daily_meditation_done, evangelism_q_done")
          .gte("week_start_date", start)
          .lte("week_start_date", end)
          .eq("shepherd_id", id);
        const acts = actRes.data || [];
        avgDiscipline = acts.length > 0
          ? Math.round(acts.reduce((sum: number, a: any) => {
              const scores = [a.prayer_q_done ? 100 : 0, a.daily_meditation_done ? 100 : 0, a.evangelism_q_done ? 100 : 0];
              return sum + scores.reduce((x, y) => x + y, 0) / scores.length;
            }, 0) / acts.length)
          : 0;
      }

      result.push({
        entity,
        memberCount,
        avgAttendance,
        avgDiscipline,
        avgScore: Math.round((avgAttendance + avgDiscipline) / 2),
      });
    }

    setRows(result);
    setLoading(false);
  }

  function toggleEntity(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 rounded-2xl shadow-sm flex flex-wrap gap-3">
        {([
          { type: "group" as const, label: "Groupes", icon: "diversity_3" },
          { type: "shepherd" as const, label: "Bergers", icon: "church" },
          { type: "department" as const, label: "Départements", icon: "apartment" },
        ]).map((t) => (
          <button
            key={t.type}
            onClick={() => setEntityType(t.type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              entityType === t.type ? "bg-[#3E8EED] text-white shadow-md" : "bg-white/60 text-[#6E6D79] hover:bg-white border border-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-panel p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-sm text-[#6E6D79]">filter_alt</span>
          <span className="text-sm font-bold text-[#1E1B4B]">Sélectionner les entités à comparer</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {entities.map((e) => (
            <button
              key={e.id}
              onClick={() => toggleEntity(e.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedIds.includes(e.id) ? "bg-[#3E8EED] text-white shadow-md" : "bg-white/60 text-[#1E1B4B] border border-slate-100 hover:bg-white"
              }`}
            >
              {e.name}
            </button>
          ))}
          {entities.length === 0 && <span className="text-sm text-[#6E6D79]">Aucune entité.</span>}
        </div>
      </div>

      {loading && <div className="text-sm text-[#6E6D79] px-1">Calcul en cours…</div>}

      {rows.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-[#6E6D79]">Entité</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-[#6E6D79]">Membres</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-[#6E6D79]">Présence</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-[#6E6D79]">Discipline</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-[#6E6D79]">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.entity.id} className="border-b border-slate-50 hover:bg-white/60 transition-all">
                  <td className="py-3 px-4 font-bold text-[#1E1B4B]">{r.entity.name}</td>
                  <td className="text-center py-3 px-4 font-bold text-[#1E1B4B]">{r.memberCount}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-bold ${r.avgAttendance >= 70 ? "text-[#53B064]" : r.avgAttendance >= 50 ? "text-[#E8912F]" : "text-[#EF4444]"}`}>{r.avgAttendance}%</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-bold ${r.avgDiscipline >= 70 ? "text-[#53B064]" : r.avgDiscipline >= 50 ? "text-[#E8912F]" : "text-[#EF4444]"}`}>{r.avgDiscipline}%</span>
                  </td>
                  <td className="text-center py-3 px-4 font-black text-[#3E8EED]">{r.avgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

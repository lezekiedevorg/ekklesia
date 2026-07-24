"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  leader_id: string | null;
  member_count: number;
}

// ponytail: group names are a fixed pg enum (Puissance/Gloire/Sagesse), so this
// screen manages the responsable (leader) + shows the head-count, not creation.
export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, profilesRes] = await Promise.all([
        supabase.from("groups").select("id, name, leader_id").order("name"),
        supabase.from("profiles").select("id, first_name, last_name, role, group_id"),
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const allProfiles = (profilesRes.data || []) as any[];
      const counts: Record<string, number> = {};
      allProfiles.forEach((p) => {
        if (p.group_id) counts[p.group_id] = (counts[p.group_id] || 0) + 1;
      });

      setProfiles(allProfiles);
      setGroups(
        (groupsRes.data || []).map((g: any) => ({
          ...g,
          member_count: counts[g.id] || 0,
        }))
      );
    } catch (err: any) {
      setError(err.message || "Erreur de chargement des groupes.");
    } finally {
      setLoading(false);
    }
  }

  async function setLeader(groupId: string, leaderId: string) {
    setSavingId(groupId);
    setError(null);
    try {
      const { error } = await supabase
        .from("groups")
        .update({ leader_id: leaderId || null })
        .eq("id", groupId);
      if (error) throw error;
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, leader_id: leaderId || null } : g))
      );
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'affectation du responsable.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <PageLoader label="Chargement des cellules..." />;
  }

  const colors = ["from-[#3E8EED] to-[#2563eb]", "from-[#A16EFF] to-[#7c3aed]", "from-[#E8912F] to-[#D97B1E]"];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-20 font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in-up">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3 border border-[#fea619]/40 shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#fea619]">hub</span>
            <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Cellules / Tribus</span>
          </div>
          <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
            Groupes & Responsables
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-medium max-w-2xl">
            Affectez le responsable (leader) de chaque cellule et suivez le nombre d&apos;encadrants rattachés.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group, i) => {
            const leader = profiles.find((p) => p.id === group.leader_id);
            return (
              <div key={group.id} className="card-luxe p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[i % colors.length]} text-white flex items-center justify-center text-2xl shadow-md`}>
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#1e1b4b]">{group.member_count}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encadrants</div>
                  </div>
                </div>
                <h3 className="text-base font-headline-md font-extrabold text-[#1e1b4b] mb-3">{group.name}</h3>

                <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Responsable
                </label>
                <select
                  value={group.leader_id || ""}
                  disabled={savingId === group.id}
                  onChange={(e) => setLeader(group.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] disabled:opacity-50"
                >
                  <option value="">— Aucun responsable —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.role})
                    </option>
                  ))}
                </select>
                {leader && (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4A47B8] mt-3 pt-3 border-t border-slate-100">
                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                    {leader.first_name} {leader.last_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

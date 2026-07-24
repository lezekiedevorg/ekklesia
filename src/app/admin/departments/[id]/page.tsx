"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  leader_id: string | null;
  is_active: boolean;
  created_at: string;
  leader?: { first_name: string; last_name: string } | null;
}

interface DepartmentMember {
  member_id: string;
  department_id: string;
  role: string;
  joined_at: string;
  member?: {
    first_name: string;
    last_name: string;
    phone: string | null;
    status: string;
  };
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allMembers, setAllMembers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [departmentId]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: dept, error: deptError } = await supabase
        .from("departments")
        .select("*, leader:profiles!departments_leader_id_fkey(first_name, last_name)")
        .eq("id", departmentId)
        .single();

      if (deptError) throw deptError;
      setDepartment(dept);

      const { data: memberDepts } = await supabase
        .from("member_departments")
        .select("*, member:members(first_name, last_name, phone, status)")
        .eq("department_id", departmentId);

      setMembers(memberDepts || []);

      const { data: allMems } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .is("archived_at", null)
        .order("first_name");

      setAllMembers(allMems || []);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignMember() {
    if (!selectedMemberId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("member_departments").upsert(
        [{ member_id: selectedMemberId, department_id: departmentId, role: selectedRole }],
        { onConflict: "member_id,department_id" }
      );
      if (error) throw error;
      setShowAssignModal(false);
      setSelectedMemberId("");
      setSelectedRole("member");
      loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Retirer ce membre du département ?")) return;
    try {
      const { error } = await supabase
        .from("member_departments")
        .delete()
        .eq("member_id", memberId)
        .eq("department_id", departmentId);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  }

  if (loading) {
    return <PageLoader label="Chargement du département..." />;
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-slate-500">Département non trouvé.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-20 font-sans">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in-up">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/admin/departments" className="hover:text-[#4A47B8] transition-colors">Départements</Link>
          <span>/</span>
          <span className="text-[#1e1b4b]">{department.name}</span>
        </div>

        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] text-white flex items-center justify-center text-3xl shadow-md">
                {department.icon}
              </div>
              <div>
                <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
                  {department.name}
                </h1>
                {department.leader && (
                  <p className="text-xs font-bold text-[#4A47B8] mt-1">
                    Responsable: {department.leader.first_name} {department.leader.last_name}
                  </p>
                )}
                <p className="text-sm text-slate-500 font-medium mt-1">{department.description}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-6 py-4 rounded-2xl font-headline-md font-extrabold text-xs text-white bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-lg shadow-indigo-950/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2.5 cursor-pointer border border-[#fea619]/40"
            >
              <span className="material-symbols-outlined text-[20px] text-[#fea619]">person_add</span>
              Assigner un membre
            </button>
          </div>
        </div>

        {/* Members List */}
        <div className="glass-panel rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <h2 className="text-sm font-headline-md font-extrabold text-[#1e1b4b]">
              Membres du département
              <span className="ml-2 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#1e1b4b]/10 text-[#1e1b4b]">{members.length}</span>
            </h2>
          </div>
          {members.length === 0 ? (
            <div className="p-14 text-center text-slate-400 text-sm font-medium">
              Aucun membre assigné à ce département.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div key={m.member_id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-white text-xs font-black flex items-center justify-center">
                      {m.member?.first_name[0]}{m.member?.last_name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1e1b4b]">{m.member?.first_name} {m.member?.last_name}</div>
                      <div className="text-[11px] text-slate-500">{m.member?.phone || "Pas de téléphone"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {m.role === "leader" ? "Responsable" : m.role === "responsible" ? "Chargé" : "Membre"}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(m.member_id)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
              <h2 className="text-xl font-headline-md font-extrabold text-[#1e1b4b] mb-5">Assigner un membre</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Membre</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 cursor-pointer"
                  >
                    <option value="">Sélectionner un membre...</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Rôle</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 cursor-pointer"
                  >
                    <option value="member">Membre</option>
                    <option value="leader">Responsable</option>
                    <option value="responsible">Chargé de projet</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAssignMember}
                    disabled={!selectedMemberId || saving}
                    className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Assignation..." : "Assigner"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

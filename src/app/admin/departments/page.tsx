"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  member_count: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", description: "", icon: "🏛️" });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select(`
          *,
          leader:profiles!departments_leader_id_fkey(first_name, last_name),
          member_departments(count)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const depts = (data || []).map((dept: any) => ({
        ...dept,
        member_count: dept.member_departments?.[0]?.count || 0,
      }));

      setDepartments(depts);
    } catch (err) {
      console.error("Erreur de chargement des départements:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("departments").insert([newDept]);
      if (error) throw error;
      setShowCreateModal(false);
      setNewDept({ name: "", description: "", icon: "🏛️" });
      loadDepartments();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoader label="Chargement des départements..." />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-20 font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3 border border-[#fea619]/40 shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]">apartment</span>
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Départements Ministériels</span>
            </div>
            <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
              Gestion des Départements
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-medium max-w-2xl">
              Organisez les ministères de l&apos;église et gérez l&apos;assignation des membres.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-4 rounded-2xl font-headline-md font-extrabold text-xs text-white bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-lg shadow-indigo-950/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2.5 cursor-pointer border border-[#fea619]/40"
          >
            <span className="material-symbols-outlined text-[20px] text-[#fea619]">add_circle</span>
            Nouveau Département
          </button>
        </div>

        {/* Department Grid */}
        {departments.length === 0 ? (
          <div className="glass-panel rounded-3xl p-14 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#1e1b4b] mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">apartment</span>
            </div>
            <h3 className="text-base font-headline-md font-extrabold text-slate-900">
              Aucun département configuré
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1.5 max-w-sm mx-auto">
              Créez votre premier département ministériel pour commencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/admin/departments/${dept.id}`}
                className="card-luxe p-6 hover:border-[#4A47B8]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    {dept.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#1e1b4b]">{dept.member_count}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Membres</div>
                  </div>
                </div>
                <h3 className="text-base font-headline-md font-extrabold text-[#1e1b4b] mb-1">{dept.name}</h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3">{dept.description || "Aucune description"}</p>
                {dept.leader && (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4A47B8] pt-3 border-t border-slate-100">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {dept.leader.first_name} {dept.leader.last_name}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-[#fea619] flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </div>
                <h2 className="text-xl font-headline-md font-extrabold text-[#1e1b4b]">Nouveau Département</h2>
              </div>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Nom</label>
                  <input
                    type="text"
                    required
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]"
                    placeholder="Ex: Jeunesse"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Description</label>
                  <textarea
                    value={newDept.description}
                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]"
                    rows={3}
                    placeholder="Description du département..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">Icône</label>
                  <input
                    type="text"
                    value={newDept.icon}
                    onChange={(e) => setNewDept({ ...newDept, icon: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b]"
                    placeholder="🏛️"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#1e1b4b] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Création..." : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

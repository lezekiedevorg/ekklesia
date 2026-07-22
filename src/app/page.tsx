"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WeekSelector from "@/components/common/WeekSelector";

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
  groups?: { name: string } | null;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    newMembers: 0,
    absentToRelaunch: 0,
    totalShepherds: 0,
    pendingReports: 0,
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("*, groups!profiles_group_id_fkey(name)")
          .eq("id", user.id)
          .single();

        if (!prof) {
          router.push("/profile");
          return;
        }

        setProfile(prof as ProfileData);

        // Fetch relevant statistics based on role
        if (prof.role === "shepherd") {
          const { data: members } = await supabase
            .from("members")
            .select("status")
            .eq("shepherd_id", user.id)
            .is("archived_at", null)
            .neq("status", "archived");

          if (members) {
            setStats({
              totalMembers: members.length,
              newMembers: members.filter((m) => m.status === "new").length,
              absentToRelaunch: members.filter((m) => m.status === "absent_to_relaunch").length,
              totalShepherds: 0,
              pendingReports: 0,
            });
          }
        } else if (prof.role === "leader") {
          const { data: groupShepherds } = await supabase
            .from("profiles")
            .select("id")
            .eq("group_id", prof.group_id);

          const shepherdIds = groupShepherds?.map((s) => s.id) || [];

          const { data: members } = await supabase
            .from("members")
            .select("status")
            .in("shepherd_id", shepherdIds.length > 0 ? shepherdIds : ["00000000-0000-0000-0000-000000000000"])
            .is("archived_at", null)
            .neq("status", "archived");

          const { data: reports } = await supabase
            .from("weekly_reports")
            .select("id")
            .in("shepherd_id", shepherdIds.length > 0 ? shepherdIds : ["00000000-0000-0000-0000-000000000000"])
            .eq("status", "submitted");

          setStats({
            totalMembers: members?.length || 0,
            newMembers: members?.filter((m) => m.status === "new").length || 0,
            absentToRelaunch: members?.filter((m) => m.status === "absent_to_relaunch").length || 0,
            totalShepherds: shepherdIds.length,
            pendingReports: reports?.length || 0,
          });
        } else if (prof.role === "pastor") {
          const { data: members } = await supabase
            .from("members")
            .select("status")
            .is("archived_at", null)
            .neq("status", "archived");
          const { data: shepherds } = await supabase.from("profiles").select("id").eq("role", "shepherd");
          const { data: reports } = await supabase.from("weekly_reports").select("id").eq("status", "submitted");

          setStats({
            totalMembers: members?.length || 0,
            newMembers: members?.filter((m) => m.status === "new").length || 0,
            absentToRelaunch: members?.filter((m) => m.status === "absent_to_relaunch").length || 0,
            totalShepherds: shepherds?.length || 0,
            pendingReports: reports?.length || 0,
          });
        }
      } catch (err) {
        console.error("Erreur de chargement du tableau de bord:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center text-[#47464f]">
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 font-label-caps font-bold text-sm">
          <svg className="animate-spin h-5 w-5 text-[#1e1b4b]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement du Sanctuaire...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] pb-24 font-sans">
      <Navbar
        role={profile?.role || "shepherd"}
        groupName={profile?.groups?.name}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in-up">
        {/* Header Section with WeekSelector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3 border border-[#fea619]/30 shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-[#fea619]">
                {profile?.role === "pastor" ? "shield_person" : profile?.role === "leader" ? "admin_panel_settings" : "supervised_user_circle"}
              </span>
              <span className="font-label-caps font-bold text-[11px] tracking-wider uppercase">
                {profile?.role === "pastor"
                  ? "Supervision Générale de l'Église"
                  : profile?.role === "leader"
                  ? `Responsable • Groupe ${profile?.groups?.name || ""}`
                  : `Berger • Groupe ${profile?.groups?.name || ""}`}
              </span>
            </div>
            <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#1e1b4b] tracking-tight">
              Shalom, {profile?.first_name} {profile?.last_name} ✨
            </h1>
          </div>

          <WeekSelector selectedDate={selectedDate} onChangeDate={setSelectedDate} />
        </div>

        {/* Quote Block - Sanctuaire Premium Style */}
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#fea619] relative overflow-hidden group hover:border-l-[#1e1b4b] transition-all duration-500 shadow-sm">
          <div className="absolute -right-8 -top-8 text-[#1e1b4b]/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-[120px]">format_quote</span>
          </div>
          <p className="font-sans text-base md:text-lg text-[#191c1e] italic mb-2 relative z-10 leading-relaxed font-medium">
            &quot;Paissez le troupeau de Dieu qui est sous votre garde, non par contrainte, mais volontairement, selon Dieu.&quot;
          </p>
          <p className="font-label-caps font-bold text-xs text-[#47464f] relative z-10">— 1 Pierre 5:2</p>
        </div>

        {/* KPI Grid - Sanctuaire Glass Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Total Fidèles */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-bold text-xs uppercase tracking-wider text-[#47464f]">
                {profile?.role === "shepherd" ? "Mes Âmes (Actives)" : "Total Fidèles Actifs"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#1e1b4b]/10 text-[#1e1b4b] flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-stat-mono font-bold text-3xl text-[#1e1b4b]">{stats.totalMembers}</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center bg-emerald-100/80 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> Actifs
              </span>
            </div>
            <div className="text-[11px] text-[#47464f] font-medium mt-2">Membres non archivés</div>
          </div>

          {/* KPI 2: Intégration (4 Semaines) */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-bold text-xs uppercase tracking-wider text-[#47464f]">
                En Intégration (4 Sem.)
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-stat-mono font-bold text-3xl text-[#1e1b4b]">{stats.newMembers}</span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Nouveaux</span>
            </div>
            <div className="text-[11px] text-[#47464f] font-medium mt-2">Suivi initial des âmes</div>
          </div>

          {/* KPI 3: Absents à relancer */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-bold text-xs uppercase tracking-wider text-rose-600">
                Absents à relancer
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px] animate-pulse">notifications_active</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-stat-mono font-bold text-3xl text-rose-600">{stats.absentToRelaunch}</span>
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">Alerte !</span>
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-2">Visite ou appel pastoral requis</div>
          </div>

          {/* KPI 4: Role-Specific Actionable Stat */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-bold text-xs uppercase tracking-wider text-[#47464f]">
                {profile?.role === "shepherd" ? "Discipline Hebdo" : "Rapports & Bergers"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#fea619]/20 text-[#855300] flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">assessment</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-stat-mono font-bold text-3xl text-[#1e1b4b]">
                {profile?.role === "shepherd" ? "En cours" : stats.pendingReports}
              </span>
              {profile?.role !== "shepherd" && (
                <span className="text-xs font-bold text-amber-800 bg-[#fea619]/20 px-2 py-0.5 rounded-full">
                  À valider
                </span>
              )}
            </div>
            <div className="text-xs font-bold mt-2">
              <Link
                href={profile?.role === "shepherd" ? "/activities" : "/reports"}
                className="text-[#1e1b4b] hover:text-[#fea619] transition-colors flex items-center gap-1"
              >
                <span>{profile?.role === "shepherd" ? "Saisir ma discipline" : "Consulter les rapports"}</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Center & Pastoral Advice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md font-bold text-lg md:text-xl text-[#1e1b4b] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#fea619] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  rocket_launch
                </span>
                Actions Rapides & Suivi Pastoral
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/members"
                className="p-5 rounded-2xl bg-white/80 border border-[#c8c5d0]/30 hover:border-[#1e1b4b]/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#1e1b4b]/10 text-[#1e1b4b] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">person_add</span>
                  </div>
                  <span className="material-symbols-outlined text-[#47464f] group-hover:translate-x-1 group-hover:text-[#1e1b4b] transition-all">
                    arrow_forward
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-[#191c1e] text-base">Ajouter un nouveau fidèle</h3>
                  <p className="text-xs text-[#47464f] mt-1 font-medium leading-relaxed">
                    Inscrire une âme et l&apos;assigner à son berger et son groupe.
                  </p>
                </div>
              </Link>

              <Link
                href="/attendance"
                className="p-5 rounded-2xl bg-white/80 border border-[#c8c5d0]/30 hover:border-[#1e1b4b]/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">event_available</span>
                  </div>
                  <span className="material-symbols-outlined text-[#47464f] group-hover:translate-x-1 group-hover:text-purple-700 transition-all">
                    arrow_forward
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-[#191c1e] text-base">Feuille de présence</h3>
                  <p className="text-xs text-[#47464f] mt-1 font-medium leading-relaxed">
                    Cocher les présences par culte (Mardi, Mercredi, Jeudi, Vendredi, Dimanche).
                  </p>
                </div>
              </Link>

              <Link
                href="/activities"
                className="p-5 rounded-2xl bg-white/80 border border-[#c8c5d0]/30 hover:border-[#1e1b4b]/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                  </div>
                  <span className="material-symbols-outlined text-[#47464f] group-hover:translate-x-1 group-hover:text-emerald-700 transition-all">
                    arrow_forward
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-[#191c1e] text-base">Discipline spirituelle</h3>
                  <p className="text-xs text-[#47464f] mt-1 font-medium leading-relaxed">
                    Suivi quotidien des méditations (0-7), prières (0-7h), et évangélisation.
                  </p>
                </div>
              </Link>

              <Link
                href="/reports"
                className="p-5 rounded-2xl bg-white/80 border border-[#c8c5d0]/30 hover:border-[#1e1b4b]/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#fea619]/20 text-[#855300] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">assessment</span>
                  </div>
                  <span className="material-symbols-outlined text-[#47464f] group-hover:translate-x-1 group-hover:text-[#855300] transition-all">
                    arrow_forward
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-[#191c1e] text-base">Clôture & Rapports</h3>
                  <p className="text-xs text-[#47464f] mt-1 font-medium leading-relaxed">
                    Consolider les statistiques hebdomadaires et valider les rapports des bergers.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Pastoral Advice & Progress Sidebar */}
          <div className="bg-gradient-to-br from-[#1e1b4b] via-[#1e1b4b] to-[#2e2a6d] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl text-white relative overflow-hidden border border-[#fea619]/30">
            <div className="absolute -right-12 -bottom-12 w-60 h-60 bg-[#fea619]/15 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#fea619] mb-6 shadow-2xs">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  church
                </span>
              </div>
              <h3 className="font-headline-md font-bold text-lg text-white">Vision Spirituelle</h3>
              <p className="text-xs text-[#e3dfff]/90 mt-3 leading-relaxed font-medium italic">
                &quot;Prenez donc garde à vous-mêmes, et à tout le troupeau sur lequel le Saint-Esprit vous a établis évêques, pour paître l&apos;Église du Seigneur, qu&apos;il s&apos;est acquise par son propre sang.&quot;
              </p>
              <div className="text-[11px] font-label-caps font-bold text-[#fea619] mt-3">— Actes 20:28</div>
            </div>

            <div className="mt-8 pt-5 border-t border-white/10">
              <div className="text-xs text-[#e3dfff] flex items-center justify-between font-label-caps font-bold">
                <span>Objectif de Prière Hebdo :</span>
                <span className="font-stat-mono text-[#fea619]">7h / 7h</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#fea619] to-amber-300 h-full w-4/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

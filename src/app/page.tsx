"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WeekSelector from "@/components/common/WeekSelector";
import NewcomerFriendDashboard from "@/components/dashboard/NewcomerFriendDashboard";
import { hasOwnScope } from "@/lib/auth/roles";

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd" | "newcomer_friend";
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

        // Fetch relevant statistics based on role (main app = pastoral/berger view)
        if (hasOwnScope(prof.role)) {
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
        } else {
          // pastor, admin, super_admin : vue globale
          const { data: members } = await supabase
            .from("members")
            .select("status")
            .is("archived_at", null)
            .neq("status", "archived");

          const { data: shepherds } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "shepherd");

          const { data: reports } = await supabase
            .from("weekly_reports")
            .select("id")
            .eq("status", "submitted");

          setStats({
            totalMembers: members?.length || 0,
            newMembers: members?.filter((m) => m.status === "new").length || 0,
            absentToRelaunch: members?.filter((m) => m.status === "absent_to_relaunch").length || 0,
            totalShepherds: shepherds?.length || 0,
            pendingReports: reports?.length || 0,
          });
        }
      } catch (err) {
        console.error("Erreur de chargement du dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase, router, selectedDate]);

  if (loading) {
    return <PageLoader label="Ouverture du Sanctuaire..." />;
  }

  // Les Amis des Nouveaux ont leur propre tableau de bord dédié
  if (profile?.role === "newcomer_friend") {
    return <NewcomerFriendDashboard firstName={profile.first_name} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-28 font-sans">

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in-up page-transition">
        {/* Hero Welcome Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-white mb-3 border border-[#fea619]/40 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {profile?.role === "pastor" ? "shield_person" : profile?.role === "leader" ? "admin_panel_settings" : "supervised_user_circle"}
              </span>
              <span className="font-label-caps font-extrabold text-[11px] tracking-wider uppercase">
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
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
              Votre tableau de bord pastoral pour suivre la progression spirituelle des fidèles, l&apos;assiduité aux cultes et les disciplines quotidiennes.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <WeekSelector selectedDate={selectedDate} onChangeDate={setSelectedDate} />
          </div>
        </div>

        {/* Quote Block - Luxe Glass */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-l-4 border-l-[#fea619] relative overflow-hidden group hover:border-l-[#1e1b4b] transition-all duration-500 shadow-xs">
          <div className="absolute -right-6 -top-6 text-[#1e1b4b]/5 pointer-events-none group-hover:scale-110 group-hover:text-[#1e1b4b]/10 transition-all duration-700">
            <span className="material-symbols-outlined text-[140px]">format_quote</span>
          </div>
          <p className="font-sans text-base md:text-lg text-slate-800 italic mb-2.5 relative z-10 leading-relaxed font-semibold">
            &quot;Paissez le troupeau de Dieu qui est sous votre garde, non par contrainte, mais volontairement, selon Dieu.&quot;
          </p>
          <p className="font-label-caps font-extrabold text-xs text-slate-500 relative z-10 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#fea619] inline-block rounded-full" />
            1 Pierre 5:2
          </p>
        </div>

        {/* KPI Grid - 4 Interactive Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Total Fidèles */}
          <Link href="/members" className="glass-panel-interactive rounded-3xl p-6 relative overflow-hidden group block">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider text-slate-500">
                {profile?.role === "shepherd" ? "Mes Âmes (Actives)" : "Total Fidèles Actifs"}
              </span>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#1e1b4b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#1e1b4b] group-hover:text-white transition-all shadow-2xs">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-stat-mono font-extrabold text-3xl text-[#1e1b4b] tracking-tight">{stats.totalMembers}</span>
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> Actifs
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-3 flex items-center justify-between">
              <span>Membres en suivi</span>
              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          {/* KPI 2: Intégration (4 Semaines) */}
          <Link href="/members" className="glass-panel-interactive rounded-3xl p-6 relative overflow-hidden group block">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider text-slate-500">
                En Intégration (4 Sem.)
              </span>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs">
                <span className="material-symbols-outlined text-[22px]">person_add</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-stat-mono font-extrabold text-3xl text-purple-950 tracking-tight">{stats.newMembers}</span>
              <span className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full">Nouveaux</span>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-3 flex items-center justify-between">
              <span>Accueil & enracinement</span>
              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          {/* KPI 3: Absents à relancer */}
          <Link href="/members?status=absent_to_relaunch" className="glass-panel-interactive rounded-3xl p-6 relative overflow-hidden group block border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider text-rose-600">
                Absents à relancer
              </span>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-2xs">
                <span className="material-symbols-outlined text-[22px] animate-pulse">notifications_active</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-stat-mono font-extrabold text-3xl text-rose-600 tracking-tight">{stats.absentToRelaunch}</span>
              <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                Alerte !
              </span>
            </div>
            <div className="text-[11px] text-rose-600/90 font-bold mt-3 flex items-center justify-between">
              <span>Visite/Appel pastoral requis</span>
              <span className="material-symbols-outlined text-[16px] text-rose-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          {/* KPI 4: Role-Specific Actionable Stat */}
          <Link
            href={profile?.role === "shepherd" ? "/activities" : "/reports"}
            className="glass-panel-interactive rounded-3xl p-6 relative overflow-hidden group block"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider text-slate-500">
                {profile?.role === "shepherd" ? "Discipline Hebdo" : "Rapports & Bergers"}
              </span>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#fea619] group-hover:text-white transition-all shadow-2xs">
                <span className="material-symbols-outlined text-[22px]">assessment</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-stat-mono font-extrabold text-2xl text-[#1e1b4b] tracking-tight">
                {profile?.role === "shepherd" ? "En cours" : `${stats.pendingReports} soumis`}
              </span>
              {profile?.role !== "shepherd" && (
                <span className="text-xs font-black text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  À valider
                </span>
              )}
            </div>
            <div className="text-xs font-bold mt-3 text-[#1e1b4b] group-hover:text-[#312e81] flex items-center justify-between">
              <span>{profile?.role === "shepherd" ? "Saisir ma discipline" : "Consulter les bilans"}</span>
              <span className="material-symbols-outlined text-[16px] text-[#fea619] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>
        </div>

        {/* Action Center & Pastoral Advice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions rapides */}
          <div className="lg:col-span-2 glass-panel rounded-[32px] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md font-extrabold text-lg sm:text-xl text-[#1e1b4b] flex items-center gap-3 tracking-tight">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-white flex items-center justify-center shadow-md shadow-indigo-950/20">
                  <span className="material-symbols-outlined text-[20px] text-[#fea619]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                </span>
                Actions Rapides & Suivi Pastoral
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/members"
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#1e1b4b] flex items-center justify-center group-hover:bg-[#1e1b4b] group-hover:text-white transition-all duration-300 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">person_add</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-[#1e1b4b] group-hover:translate-x-1 transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-slate-900 text-base group-hover:text-[#1e1b4b] transition-colors">
                    Ajouter une nouvelle âme
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Inscrire un fidèle et l&apos;assigner à son berger et son groupe d&apos;appartenance.
                  </p>
                </div>
              </Link>

              <Link
                href="/attendance"
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">event_available</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:translate-x-1 transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-slate-900 text-base group-hover:text-purple-950 transition-colors">
                    Feuille de présence
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Cocher les présences aux cultes (Mardi, Mercredi, Jeudi, Vendredi, Dimanche).
                  </p>
                </div>
              </Link>

              <Link
                href="/activities"
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-slate-900 text-base group-hover:text-emerald-950 transition-colors">
                    Discipline spirituelle
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Suivi quotidien des méditations (0-7), prières (0-7h), et victoires d&apos;évangélisation.
                  </p>
                </div>
              </Link>

              <Link
                href="/reports"
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 flex items-center justify-center group-hover:bg-[#fea619] group-hover:text-white transition-all duration-300 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">assessment</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-800 group-hover:translate-x-1 transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-slate-900 text-base group-hover:text-amber-950 transition-colors">
                    Clôture & Rapports
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Consolider les statistiques hebdomadaires et valider les bilans des bergers.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Pastoral Advice & Vision Sidebar Card */}
          <div className="bg-gradient-to-br from-[#1e1b4b] via-[#23205a] to-[#312e81] rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl text-white relative overflow-hidden border border-[#fea619]/40">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-[#fea619] mb-6 shadow-md">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <h3 className="font-headline-md font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
                Vision Spirituelle
              </h3>
              <p className="text-xs text-indigo-100/90 mt-3 leading-relaxed font-medium italic">
                &quot;Le bon berger donne sa vie pour ses brebis. Veillez sur chaque âme avec amour, patience, assiduité dans la prière et compassion.&quot;
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 space-y-4">
              <div className="flex items-center justify-between text-xs font-label-caps font-bold">
                <span className="text-indigo-200">Objectif Prière Hebdo</span>
                <span className="text-[#fea619] font-stat-mono">7h / 7h</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-[#fea619] to-amber-300 h-full rounded-full transition-all duration-1000" style={{ width: "100%" }} />
              </div>

              <Link
                href="/profile"
                className="w-full py-3.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 font-label-caps font-bold text-xs text-white transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 group"
              >
                <span>Mon profil & Paramètres</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

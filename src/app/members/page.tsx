"use client";

import { useCallback, useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import { hasOwnScope } from "@/lib/auth/roles";
import {
  getActiveListId,
  getAllLists,
  getList,
  subscribeToChanges,
  type NamedList,
} from "@/lib/storage/namedLists";
import { MembersListManager } from "@/components/members/MembersListManager";
import {
  MembersListPrint,
  type PrintMember,
} from "@/components/members/MembersListPrint";
import { MemberCardCheckbox } from "@/components/members/MemberCardCheckbox";
import { ActiveListBanner } from "@/components/members/ActiveListBanner";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  shepherd_id: string | null;
  invited_by_member_id: string | null;
  status:
    "new" | "in_integration" | "member" | "absent_to_relaunch" | "archived";
  current_class: "none" | "tuesday_class" | "wednesday_class" | "completed";
  consecutive_sundays_present: number;
  consecutive_absences: number;
  last_seen_date: string;
  archived_at?: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
  groups?: { name: string } | null;
}

export default function MembersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]); // pour sélection invité_par
  const [shepherds, setShepherds] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Onglets Actifs vs Nouveaux vs Archives
  const [activeTab, setActiveTab] = useState<"active" | "newcomers" | "archived">("active");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // État Modale unifiée (Création & Modification)
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentMember, setCurrentMember] = useState<{
    id?: string;
    first_name: string;
    last_name: string;
    phone: string;
    shepherd_id: string;
    invited_by_member_id: string;
    status: Member["status"];
    current_class: Member["current_class"];
  }>({
    first_name: "",
    last_name: "",
    phone: "",
    shepherd_id: "",
    invited_by_member_id: "",
    status: "new",
    current_class: "none",
  });

  // Données d'inscription des nouveaux (date, invité par)
  const [newcomerRegistrations, setNewcomerRegistrations] = useState<Record<string, { registration_date: string; invited_by_member_id: string | null }>>({});

  // État de modification rapide de classe sur la carte
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Listes nommées (localStorage) + impression PDF
  const [namedLists, setNamedLists] = useState<NamedList[]>([]);
  const [activeListId, setActiveListIdState] = useState<string | null>(null);
  const [showListsManager, setShowListsManager] = useState(false);
  const [printData, setPrintData] = useState<{
    title: string;
    subtitle?: string;
    members: PrintMember[];
  } | null>(null);

  const refreshLists = useCallback(() => {
    setNamedLists(getAllLists());
    setActiveListIdState(getActiveListId());
  }, []);

  useEffect(() => {
    refreshLists();
    return subscribeToChanges(refreshLists);
  }, [refreshLists]);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
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
        setProfile(prof as Profile);

        // Récupérer les bergers pour la liste déroulante d'assignation
        const { data: shepherdsData } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "shepherd");
        if (shepherdsData) setShepherds(shepherdsData as Profile[]);

        // Récupérer l'ensemble des fidèles pour la liste "Invité par"
        const { data: allMems } = await supabase.from("members").select("*");
        if (allMems) setAllMembers(allMems as Member[]);

        // Filtrer les fidèles selon le rôle dans la sphère (berger, leader ou pasteur)
        let query = supabase
          .from("members")
          .select("*")
          .order("first_name", { ascending: true });
        if (hasOwnScope(prof.role)) {
          query = query.eq("shepherd_id", user.id);
        } else if (prof.role === "leader") {
          const { data: grpShepherds } = await supabase
            .from("profiles")
            .select("id")
            .eq("group_id", prof.group_id);
          const sIds = grpShepherds?.map((s) => s.id) || [];
          query = query.in(
            "shepherd_id",
            sIds.length > 0 ? sIds : ["00000000-0000-0000-0000-000000000000"],
          );
        }

        const { data: mems } = await query;
        if (mems) setMembers(mems as Member[]);

        // Récupérer les données d'inscription des nouveaux
        const { data: registrations } = await supabase
          .from("newcomer_registrations")
          .select("member_id, registration_date, invited_by_member_id");
        if (registrations) {
          const regMap: Record<string, { registration_date: string; invited_by_member_id: string | null }> = {};
          for (const r of registrations) {
            regMap[r.member_id] = {
              registration_date: r.registration_date,
              invited_by_member_id: r.invited_by_member_id,
            };
          }
          setNewcomerRegistrations(regMap);
        }
      } catch (err) {
        console.error("Erreur de chargement des membres:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [router, supabase]);

  const openCreateModal = () => {
    setCurrentMember({
      first_name: "",
      last_name: "",
      phone: "",
      shepherd_id: profile?.id || "",
      invited_by_member_id: "",
      status: "new",
      current_class: "none",
    });
    setModalMode("create");
  };

  const openEditModal = (member: Member) => {
    setCurrentMember({
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone || "",
      shepherd_id: member.shepherd_id || profile?.id || "",
      invited_by_member_id: member.invited_by_member_id || "",
      status: member.status,
      current_class: member.current_class,
    });
    setModalMode("edit");
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === "create") {
        const payload = {
          first_name: currentMember.first_name.trim(),
          last_name: currentMember.last_name.trim(),
          phone: currentMember.phone.trim() || null,
          shepherd_id: currentMember.shepherd_id || profile?.id || null,
          invited_by_member_id: currentMember.invited_by_member_id || null,
          current_class: currentMember.current_class,
          status: "new" as const,
          consecutive_sundays_present: 1,
          consecutive_absences: 0,
        };

        const { data, error } = await supabase
          .from("members")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setMembers((prev) => [...prev, data as Member]);
          setAllMembers((prev) => [...prev, data as Member]);
          setModalMode(null);
        }
      } else if (modalMode === "edit" && currentMember.id) {
        const payload = {
          first_name: currentMember.first_name.trim(),
          last_name: currentMember.last_name.trim(),
          phone: currentMember.phone.trim() || null,
          shepherd_id: currentMember.shepherd_id || profile?.id || null,
          invited_by_member_id: currentMember.invited_by_member_id || null,
          current_class: currentMember.current_class,
          status: currentMember.status,
        };

        const { data, error } = await supabase
          .from("members")
          .update(payload)
          .eq("id", currentMember.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setMembers((prev) =>
            prev.map((m) => (m.id === currentMember.id ? (data as Member) : m)),
          );
          setAllMembers((prev) =>
            prev.map((m) => (m.id === currentMember.id ? (data as Member) : m)),
          );
          setModalMode(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement des informations de l'âme.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClass = async (
    memberId: string,
    newClass: Member["current_class"],
  ) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ current_class: newClass })
        .eq("id", memberId);

      if (error) throw error;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, current_class: newClass } : m,
        ),
      );
      setEditingClassId(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de la classe.");
    }
  };

  const handleArchiveMember = async (memberId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("members")
        .update({ status: "archived", archived_at: now })
        .eq("id", memberId);

      if (error) throw error;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, status: "archived", archived_at: now }
            : m,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'archivage du fidèle.");
    }
  };

  const handleReintegrateMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: "in_integration", archived_at: null })
        .eq("id", memberId);

      if (error) throw error;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, status: "in_integration", archived_at: null }
            : m,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réintégration du fidèle.");
    }
  };

  const handlePermanentDelete = async (memberId: string) => {
    if (
      !confirm(
        "Attention ! Cette action va supprimer définitivement cette personne de la base de données. Voulez-vous continuer ?",
      )
    ) {
      return;
    }
    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setAllMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression définitive.");
    }
  };

  const getDaysLeftBadge = (archivedAt?: string | null) => {
    if (!archivedAt)
      return (
        <span className="text-xs font-bold text-amber-700">
          ⏳ 90 jours restants
        </span>
      );
    const diffMs = Date.now() - new Date(archivedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    const daysLeft = Math.max(0, 90 - diffDays);
    return (
      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
        ⏳ Suppression dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}
      </span>
    );
  };

  const activeMembers = members.filter((m) => m.status !== "archived" && m.status !== "new");
  const newcomersList = members.filter((m) => m.status === "new");
  const archivedMembersList = members.filter((m) => m.status === "archived");

  // Membres actifs = statut officiel "member" (toute la Bergerie, indépendamment
  // de ce que "Membres Actifs" de l'onglet affiche — qui exclut new + archived).
  const officialActiveMembers = members.filter((m) => m.status === "member");

  // Handlers PDF
  const toPrintMembers = (list: Member[]): PrintMember[] =>
    list.map((m) => ({
      fullName: `${m.first_name} ${m.last_name}`.trim(),
      phone: m.phone || "",
    }));

  const handleExportActiveMembers = () => {
    if (officialActiveMembers.length === 0) {
      alert("Aucun membre actif (statut « Membre Intégré ») à exporter.");
      return;
    }
    setPrintData({
      title: "Liste des membres actifs",
      subtitle: `${officialActiveMembers.length} membres`,
      members: toPrintMembers(officialActiveMembers),
    });
  };

  const handleExportNamedList = (listId: string) => {
    const list = getList(listId);
    if (!list) return;
    if (list.memberIds.length === 0) {
      alert("Cette liste est vide. Coche au moins un membre avant d'exporter.");
      return;
    }
    const subset = members.filter((m) => list.memberIds.includes(m.id));
    setPrintData({
      title: list.name,
      subtitle: `${subset.length} membre${subset.length > 1 ? "s" : ""}`,
      members: toPrintMembers(subset),
    });
  };

  const filteredMembers = (
    activeTab === "active" ? activeMembers : activeTab === "newcomers" ? newcomersList : archivedMembersList
  ).filter((m) => {
    const matchesSearch =
      `${m.first_name} ${m.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search));
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesClass =
      classFilter === "all" || m.current_class === classFilter;
    if (activeTab === "archived" || activeTab === "newcomers") return matchesSearch;
    return matchesSearch && matchesStatus && matchesClass;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, classFilter, activeTab, itemsPerPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadge = (status: Member["status"]) => {
    switch (status) {
      case "new":
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-label-caps font-black bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />{" "}
            Nouveau
          </span>
        );
      case "in_integration":
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-label-caps font-black bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />{" "}
            En Intégration
          </span>
        );
      case "member":
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-label-caps font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-[14px]">
              verified
            </span>{" "}
            Membre Intégré
          </span>
        );
      case "absent_to_relaunch":
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-label-caps font-black bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs animate-pulse flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-[14px] text-rose-600">
              warning
            </span>{" "}
            Absent à relancer
          </span>
        );
      case "archived":
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-label-caps font-black bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
            📦 Archivé
          </span>
        );
    }
  };

  const getClassBadge = (currentClass: Member["current_class"]) => {
    switch (currentClass) {
      case "none":
        return (
          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
            Aucune classe
          </span>
        );
      case "tuesday_class":
        return (
          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Classe du
            Mardi
          </span>
        );
      case "wednesday_class":
        return (
          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Classe
            du Mercredi
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>{" "}
            Classes Terminées
          </span>
        );
    }
  };

  if (loading) {
    return <PageLoader label="Chargement de l'annuaire du troupeau..." />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-28 font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-fade-in-up">
        {/* Header Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3 border border-[#fea619]/40 shadow-xs">
              <span
                className="material-symbols-outlined text-[16px] text-[#fea619]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                groups
              </span>
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">
                Annuaire des Fidèles
              </span>
            </div>
            <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight flex items-center gap-3">
              Fidèles & Suivi des Âmes
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#1e1b4b]/10 text-[#1e1b4b] border border-[#1e1b4b]/20 shadow-2xs">
                {filteredMembers.length}
              </span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-medium max-w-2xl">
              Gérez vos fidèles, actualisez leurs informations et suivez leur
              statut spirituel de l&apos;accueil au service spirituel.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleExportActiveMembers}
              title={`Exporter les ${officialActiveMembers.length} membres actifs en PDF`}
              className="px-4 sm:px-5 py-3.5 rounded-2xl font-headline-md font-extrabold text-xs text-[#1e1b4b] bg-white hover:bg-indigo-50 border-2 border-[#1e1b4b]/20 hover:border-[#1e1b4b] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span className="hidden sm:inline">Membres actifs (PDF)</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => setShowListsManager((v) => !v)}
              className={`px-4 sm:px-5 py-3.5 rounded-2xl font-headline-md font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-2 ${
                showListsManager
                  ? "bg-[#fea619] text-[#1e1b4b] border-[#fea619] shadow-md"
                  : "bg-white text-[#1e1b4b] hover:bg-[#fea619]/10 border-[#1e1b4b]/20 hover:border-[#fea619]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">lists</span>
              <span className="hidden sm:inline">Mes listes</span>
              {namedLists.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#1e1b4b]/10 text-[10px] font-black">
                  {namedLists.length}
                </span>
              )}
            </button>
            <button
              onClick={openCreateModal}
              className="px-6 py-4 rounded-2xl font-headline-md font-extrabold text-xs text-white bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-lg shadow-indigo-950/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2.5 cursor-pointer border border-[#fea619]/40"
            >
              <span className="material-symbols-outlined text-[20px] text-[#fea619]">
                person_add
              </span>
              Inscrire une nouvelle âme
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200/80 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-label-caps font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "active"
                ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-md shadow-indigo-950/20 border border-[#fea619]/30 scale-[1.02]"
                : "bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/80 hover:text-slate-900"
            }`}
          >
            <span>Membres Actifs</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "active" ? "bg-[#fea619] text-slate-900" : "bg-slate-100 text-slate-700"}`}
            >
              {activeMembers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("newcomers")}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-label-caps font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "newcomers"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-emerald-400/40 scale-[1.02]"
                : "bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/80 hover:text-slate-900"
            }`}
          >
            <span>Nouvelles Âmes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "newcomers" ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"}`}
            >
              {newcomersList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-label-caps font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "archived"
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20 border border-amber-400/40 scale-[1.02]"
                : "bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/80 hover:text-slate-900"
            }`}
          >
            <span>Archives &amp; Purgatoire</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "archived" ? "bg-white text-amber-800" : "bg-amber-100 text-amber-800"}`}
            >
              {archivedMembersList.length}
            </span>
          </button>
        </div>

        {/* Bandeau liste active + Panneau Mes listes */}
        {activeListId && (() => {
          const list = namedLists.find((l) => l.id === activeListId);
          return list ? <ActiveListBanner list={list} onChange={refreshLists} /> : null;
        })()}

        {showListsManager && (
          <MembersListManager
            lists={namedLists}
            activeListId={activeListId}
            onExport={handleExportNamedList}
            onListsChanged={refreshLists}
          />
        )}

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass-panel p-5 rounded-3xl shadow-sm">
          <div className="relative">
            <span className="material-symbols-outlined text-slate-400 text-[20px] absolute left-4 top-3 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {activeTab === "active" ? (
            <>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs cursor-pointer"
                >
                  <option value="all">Tous les statuts spirituels</option>
                  <option value="new">Nouveaux (Dimanche 1)</option>
                  <option value="in_integration">
                    En Intégration (Dimanches 2 à 4)
                  </option>
                  <option value="member">Membres Intégrés</option>
                  <option value="absent_to_relaunch">
                    Absents à relancer ⚠️
                  </option>
                </select>
              </div>

              <div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs cursor-pointer"
                >
                  <option value="all">
                    Toutes les classes d&apos;enseignement
                  </option>
                  <option value="tuesday_class">Classe du Mardi</option>
                  <option value="wednesday_class">Classe du Mercredi</option>
                  <option value="completed">Classes Terminées</option>
                  <option value="none">Aucune classe (Non inscrit)</option>
                </select>
              </div>
            </>
          ) : activeTab === "newcomers" ? (
            <div className="md:col-span-2 flex items-center px-4 py-3 text-xs font-bold text-emerald-900 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 mr-2 shrink-0">
                person_add
              </span>
              <span>
                Les nouvelles âmes sont automatiquement promues membres après 4 présences dimanche consécutives. Relancez celles qui manquent un culte.
              </span>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center px-4 py-3 text-xs font-bold text-amber-900 bg-amber-50/90 rounded-2xl border border-amber-200/80 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] text-amber-600 mr-2 shrink-0">
                info
              </span>
              <span>
                Les fidèles dans cette section seront définitivement supprimés
                après un délai de 90 jours s&apos;ils ne sont pas réintégrés au
                troupeau.
              </span>
            </div>
          )}
        </div>

        {/* Member Grid / Cards */}
        {filteredMembers.length === 0 ? (
          <div className="glass-panel rounded-3xl p-14 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#1e1b4b] mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">
                person_off
              </span>
            </div>
            <h3 className="text-base font-headline-md font-extrabold text-slate-900">
              Aucun fidèle ne correspond à vos critères
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1.5 max-w-sm mx-auto">
              Essayez d&apos;élargir votre recherche ou de modifier vos filtres
              d&apos;affichage.
            </p>
            {activeTab === "active" && newcomersList.length > 0 && (
              <button
                onClick={() => setActiveTab("newcomers")}
                className="mt-5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 mx-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Voir {newcomersList.length} nouvelle{newcomersList.length > 1 ? "s" : ""} âme{newcomersList.length > 1 ? "s" : ""} en intégration
              </button>
            )}
          </div>
        ) : activeTab === "newcomers" ? (
          /* ─── NEWCOMER CARDS ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedMembers.map((member) => {
              const reg = newcomerRegistrations[member.id];
              const invitedBy = reg?.invited_by_member_id
                ? allMembers.find((m) => m.id === reg.invited_by_member_id)
                : null;
              const shepherd = member.shepherd_id
                ? shepherds.find((s) => s.id === member.shepherd_id)
                : null;
              const progress = Math.min(member.consecutive_sundays_present, 4);

              return (
                <div
                  key={member.id}
                  className="card-luxe p-5 transition-all flex flex-col justify-between border-emerald-200/80 bg-emerald-50/10"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {activeListId && (
                        <MemberCardCheckbox
                          memberId={member.id}
                          onChange={refreshLists}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-headline-md font-extrabold text-slate-900 truncate" title={`${member.first_name} ${member.last_name}`}>
                          {member.first_name} {member.last_name}
                        </h3>
                        {member.phone ? (
                          <a href={`tel:${member.phone}`} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[14px]">call</span> {member.phone}
                          </a>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 mt-1 block truncate">Aucun téléphone</span>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-label-caps font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Nouveau
                      </span>
                    </div>

                    <div className="space-y-2 my-3 py-3 border-y border-emerald-100/80 text-[11px] font-medium">
                      {reg?.registration_date && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold truncate">1ère visite :</span>
                          <span className="font-bold text-slate-800 whitespace-nowrap shrink-0">{new Date(reg.registration_date).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      {invitedBy && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold truncate">Invité(e) par :</span>
                          <span className="font-bold text-slate-800 whitespace-nowrap shrink-0">{invitedBy.first_name} {invitedBy.last_name}</span>
                        </div>
                      )}
                      {shepherd && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold truncate">Berger :</span>
                          <span className="font-bold text-slate-800 whitespace-nowrap shrink-0">{shepherd.first_name} {shepherd.last_name}</span>
                        </div>
                      )}
                      {member.last_seen_date && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold truncate">Dernière venue :</span>
                          <span className="font-bold text-slate-800 whitespace-nowrap shrink-0">{new Date(member.last_seen_date).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      {member.consecutive_absences > 0 && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-rose-600 font-semibold truncate">Absences consécutives :</span>
                          <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200/80 shadow-2xs whitespace-nowrap shrink-0">{member.consecutive_absences}</span>
                        </div>
                      )}
                    </div>

                    {/* Integration Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-label-caps font-extrabold text-emerald-700 uppercase tracking-wider">Intégration</span>
                        <span className="text-xs font-black text-emerald-800">{progress}/4 Dimanches</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 h-2.5 rounded-full transition-all ${i <= progress ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/30" : "bg-slate-200/80"}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-emerald-100/60 flex items-center gap-1.5">
                    <button onClick={() => router.push(`/members/${member.id}`)} className="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:border-emerald-300 transition-all flex items-center justify-center gap-1 cursor-pointer truncate shadow-2xs" title="Voir les statistiques">
                      <span className="material-symbols-outlined text-[14px]">analytics</span>
                      <span className="hidden sm:inline">Stats</span>
                    </button>
                    <button onClick={() => openEditModal(member)} className="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-100/80 hover:bg-indigo-50 text-slate-700 hover:text-[#1e1b4b] border border-slate-200/80 hover:border-indigo-200 transition-all flex items-center justify-center gap-1 cursor-pointer truncate shadow-2xs" title="Modifier">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span className="hidden sm:inline">Modifier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── REGULAR MEMBER CARDS ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedMembers.map((member) => (
              <div
                key={member.id}
                className={`card-luxe p-5 transition-all flex flex-col justify-between ${
                  activeTab === "archived"
                    ? "border-amber-200/80 bg-amber-50/20"
                    : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    {activeListId && (
                      <MemberCardCheckbox
                        memberId={member.id}
                        onChange={refreshLists}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-sm sm:text-base font-headline-md font-extrabold text-slate-900 truncate"
                        title={`${member.first_name} ${member.last_name}`}
                      >
                        {member.first_name} {member.last_name}
                      </h3>
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1 truncate"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            call
                          </span>{" "}
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 mt-1 block truncate">
                          Aucun téléphone
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(member.status)}
                    </div>
                  </div>

                  {activeTab === "archived" ? (
                    <div className="space-y-2.5 my-3.5 py-3 border-y border-amber-100/80 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-amber-900 font-semibold truncate">
                          Archivé depuis :
                        </span>
                        <span className="font-bold text-slate-700 whitespace-nowrap shrink-0">
                          {member.archived_at
                            ? new Date(member.archived_at).toLocaleDateString(
                                "fr-FR",
                              )
                            : "Récent"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-amber-900 font-semibold truncate">
                          Décompte purgatoire :
                        </span>
                        <div className="shrink-0">
                          {getDaysLeftBadge(member.archived_at)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 my-3.5 py-3.5 border-y border-slate-100 text-[11px] font-medium">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-semibold truncate">
                          Dimanches présents :
                        </span>
                        <span className="font-extrabold text-[#1e1b4b] bg-indigo-50/80 px-2.5 py-0.5 rounded-lg border border-indigo-200/60 shadow-2xs whitespace-nowrap shrink-0 font-stat-mono text-xs">
                          {member.consecutive_sundays_present >= 4
                            ? <span className="text-emerald-700">✓ Intégré ({member.consecutive_sundays_present} Dim.)</span>
                            : `${member.consecutive_sundays_present} / 4 Dim.`
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-semibold truncate">
                          Absences d&apos;affilée :
                        </span>
                        <span
                          className={`font-extrabold whitespace-nowrap shrink-0 font-stat-mono text-xs ${member.consecutive_absences >= 2 ? "text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200/80 shadow-2xs animate-pulse" : "text-slate-700"}`}
                        >
                          {member.consecutive_absences} sem.
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-semibold truncate">
                          Dernière venue :
                        </span>
                        <span className="text-slate-800 font-bold whitespace-nowrap shrink-0">
                          {member.last_seen_date
                            ? new Date(
                                member.last_seen_date,
                              ).toLocaleDateString("fr-FR")
                            : "Jamais"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls (Class for active, Reintegrate/Delete for archived) */}
                {activeTab === "archived" ? (
                  <div className="pt-3 flex items-center justify-between gap-2 border-t border-amber-100/60">
                    <button
                      onClick={() => handleReintegrateMember(member.id)}
                      className="flex-1 px-3 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        restore_from_trash
                      </span>{" "}
                      Réintégrer
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(member.id)}
                      className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Supprimer définitivement tout de suite"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete_forever
                      </span>{" "}
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-label-caps font-extrabold text-slate-500 uppercase tracking-wider truncate">
                          Classe spirituelle :
                        </span>
                        {editingClassId === member.id ? (
                          <button
                            onClick={() => setEditingClassId(null)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer shrink-0 ml-2"
                          >
                            Annuler
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingClassId(member.id)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 cursor-pointer shrink-0 ml-2 whitespace-nowrap"
                          >
                            Changer ✎
                          </button>
                        )}
                      </div>

                      {editingClassId === member.id ? (
                        <div className="grid grid-cols-2 gap-1.5 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 shadow-sm">
                          <button
                            onClick={() =>
                              handleUpdateClass(member.id, "tuesday_class")
                            }
                            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer truncate"
                          >
                            Mardi
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateClass(member.id, "wednesday_class")
                            }
                            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer truncate"
                          >
                            Mercredi
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateClass(member.id, "completed")
                            }
                            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer truncate"
                          >
                            Terminé ✓
                          </button>
                          <button
                            onClick={() => handleUpdateClass(member.id, "none")}
                            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300 transition-colors cursor-pointer truncate"
                          >
                            Aucune
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200/80">
                          <div className="min-w-0 flex-1 truncate">
                            {getClassBadge(member.current_class)}
                          </div>
                          {member.current_class !== "completed" &&
                            member.current_class !== "none" && (
                              <button
                                onClick={() =>
                                  handleUpdateClass(member.id, "completed")
                                }
                                title="Promouvoir comme classe terminée"
                                className="text-[11px] font-black text-emerald-700 hover:bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-transparent hover:border-emerald-300 transition-all shadow-2xs cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  school
                                </span>{" "}
                                Diplômer ✓
                              </button>
                            )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100/80 flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/members/${member.id}`)}
                        className="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 hover:border-indigo-300 transition-all flex items-center justify-center gap-1 cursor-pointer truncate shadow-2xs"
                        title="Voir les statistiques de fréquentation"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          analytics
                        </span>
                        <span className="hidden sm:inline">Stats</span>
                      </button>
                      <button
                        onClick={() => openEditModal(member)}
                        className="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-100/80 hover:bg-indigo-50 text-slate-700 hover:text-[#1e1b4b] border border-slate-200/80 hover:border-indigo-200 transition-all flex items-center justify-center gap-1 cursor-pointer truncate shadow-2xs"
                        title="Modifier les informations ou le statut"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          edit
                        </span>
                        <span className="hidden sm:inline">Modifier</span>
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Êtes-vous sûr de vouloir archiver ${member.first_name} ${member.last_name} ? Ce fidèle ne sera plus suivi activement et sera définitivement supprimé dans 90 jours s'il n'est pas réintégré.`,
                            )
                          ) {
                            handleArchiveMember(member.id);
                          }
                        }}
                        className="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold bg-amber-50/80 hover:bg-amber-100 text-amber-800 hover:text-amber-900 border border-amber-200 hover:border-amber-300 transition-all flex items-center justify-center gap-1 cursor-pointer truncate shadow-2xs"
                        title="Archiver ce fidèle (Purgatoire 90 jours)"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          archive
                        </span>
                        <span className="hidden sm:inline">Archiver</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {filteredMembers.length > 0 && (
          <div
            data-testid="pagination-controls"
            className="glass-panel rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">
                Affichage{" "}
                <span className="text-indigo-600 font-black">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                à{" "}
                <span className="text-indigo-600 font-black">
                  {Math.min(currentPage * itemsPerPage, filteredMembers.length)}
                </span>{" "}
                sur{" "}
                <span className="text-slate-900 font-black">
                  {filteredMembers.length}
                </span>{" "}
                fidèles
              </span>
              <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                aria-label="Nombre de fidèles par page"
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value={12}>12 par page</option>
                <option value={16}>16 par page</option>
                <option value={24}>24 par page</option>
                <option value={48}>48 par page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                ⬅️ Précédent
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 rounded-2xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                Suivant ➡️
              </button>
            </div>
          </div>
        )}

        {/* Unified Modal (Create & Edit) */}
        <Modal
          open={modalMode !== null}
          onClose={() => setModalMode(null)}
          maxWidth="max-w-3xl"
        >
          {modalMode !== null && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e1b4b] to-[#4338ca] text-[#fea619] flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[18px]">
                    {modalMode === "create" ? "person_add" : "manage_accounts"}
                  </span>
                </div>
                <h2 className="text-xl font-headline-md font-extrabold text-[#1e1b4b]">
                  {modalMode === "create"
                    ? "Inscrire une nouvelle âme"
                    : "Modifier les informations & statut"}
                </h2>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-6">
                {modalMode === "create"
                  ? "Définissez les coordonnées de base et indiquez le statut spirituel initial du fidèle dans le troupeau."
                  : "Mettez à jour les coordonnées ou ajustez le statut spirituel du fidèle."}
              </p>

              <form onSubmit={handleSaveMember} className="space-y-5">
                {/* Section Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-xs font-label-caps font-extrabold text-[#1e1b4b] uppercase tracking-wider border-b border-indigo-100/80 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#fea619]">
                      badge
                    </span>
                    1. Coordonnées & Assignation
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Prénom
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jean"
                        value={currentMember.first_name}
                        onChange={(e) =>
                          setCurrentMember({
                            ...currentMember,
                            first_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Nom
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Dupont"
                        value={currentMember.last_name}
                        onChange={(e) =>
                          setCurrentMember({
                            ...currentMember,
                            last_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                      <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Téléphone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+33 6 00 00 00 00"
                        value={currentMember.phone}
                        onChange={(e) =>
                          setCurrentMember({
                            ...currentMember,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
                      />
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Invité(e) par (Parrain / Marraine)
                      </label>
                      <select
                        value={currentMember.invited_by_member_id}
                        onChange={(e) =>
                          setCurrentMember({
                            ...currentMember,
                            invited_by_member_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="">Aucun parrain / marraine</option>
                        {allMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.first_name} {m.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Classe d&apos;enseignement spirituel
                      </label>
                      <select
                        value={currentMember.current_class}
                        onChange={(e) =>
                          setCurrentMember({
                            ...currentMember,
                            current_class: e.target
                              .value as Member["current_class"],
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="none">
                          Aucune classe pour l&apos;instant
                        </option>
                        <option value="tuesday_class">Classe du Mardi</option>
                        <option value="wednesday_class">
                          Classe du Mercredi
                        </option>
                        <option value="completed">Classes Terminées ✓</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section Statut spirituel — visible uniquement en édition */}
                {modalMode === "edit" ? (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-label-caps font-extrabold text-[#1e1b4b] uppercase tracking-wider border-b border-indigo-100/80 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#fea619]">
                      church
                    </span>
                    2. Statut Spirituel & Cycle d&apos;Intégration
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      onClick={() =>
                        setCurrentMember({ ...currentMember, status: "new" })
                      }
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        currentMember.status === "new"
                          ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="member_status"
                        checked={currentMember.status === "new"}
                        onChange={() =>
                          setCurrentMember({ ...currentMember, status: "new" })
                        }
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                          🌟 Nouveau (Dimanche 1)
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Première visite ou prise de contact récente. Débute le
                          cycle de 4 dimanches.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() =>
                        setCurrentMember({
                          ...currentMember,
                          status: "in_integration",
                        })
                      }
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        currentMember.status === "in_integration"
                          ? "bg-purple-50/90 border-purple-300 ring-2 ring-purple-500/20 shadow-sm"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="member_status"
                        checked={currentMember.status === "in_integration"}
                        onChange={() =>
                          setCurrentMember({
                            ...currentMember,
                            status: "in_integration",
                          })
                        }
                        className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                          🔄 En Intégration (Dimanches 2 à 4)
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          En cours d&apos;enracinement et d&apos;assiduité dans
                          l&apos;assemblée.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() =>
                        setCurrentMember({ ...currentMember, status: "member" })
                      }
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        currentMember.status === "member"
                          ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="member_status"
                        checked={currentMember.status === "member"}
                        onChange={() =>
                          setCurrentMember({
                            ...currentMember,
                            status: "member",
                          })
                        }
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                          ✨ Membre Intégré
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Fidèle assidu, enraciné dans l&apos;église, ayant
                          validé son intégration.
                        </p>
                      </div>
                    </label>

                    {modalMode === "edit" && (
                      <label
                        onClick={() =>
                          setCurrentMember({
                            ...currentMember,
                            status: "absent_to_relaunch",
                          })
                        }
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          currentMember.status === "absent_to_relaunch"
                            ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 shadow-sm"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="member_status"
                          checked={
                            currentMember.status === "absent_to_relaunch"
                          }
                          onChange={() =>
                            setCurrentMember({
                              ...currentMember,
                              status: "absent_to_relaunch",
                            })
                          }
                          className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-extrabold text-rose-800 flex items-center gap-2">
                            ⚠️ Absent à relancer
                          </div>
                          <p className="text-[11px] text-rose-600/90 font-medium mt-0.5">
                            Fidèle n&apos;étant plus venu depuis 2 dimanches
                            consécutifs ou plus.
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
                ) : (
                  /* En mode création, afficher un message informatif */
                  <div className="pt-2">
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-xs font-bold text-emerald-800">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">info</span>
                      <span>Ce fidèle sera enregistré comme Nouvelle Âme. Après 4 présences dimanche consécutives, il sera automatiquement promu Membre Intégré.</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100/80">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl font-headline-md font-extrabold text-xs text-white bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-lg shadow-indigo-950/25 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer border border-[#fea619]/30 flex items-center gap-2"
                  >
                    {saving
                      ? "Enregistrement..."
                      : modalMode === "create"
                        ? "Inscrire l'âme"
                        : "Enregistrer les modifications"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </main>

      {/* Composant d'impression PDF : TOUJOURS rendu, jamais démonté.
          Pattern identique à ShepherdReportPrint (rapport berger) :
          si printData === null → return null en interne.
          Ne PAS utiliser de rendu conditionnel `{printData && ...}`
          car Safari prendrait son snapshot d'impression après le démontage. */}
      <MembersListPrint data={printData} />
    </div>
  );
}

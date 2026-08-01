"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  member_id: string;
  shepherd_id: string;
  status: string;
  conversation_type: string;
  started_at: string;
  completed_at: string | null;
  last_message_at: string | null;
  turn_count: number;
  summary: string | null;
  spiritual_health_score: number | null;
  needs_attention: boolean;
  attention_reason: string | null;
  members?: { first_name: string; last_name: string };
  profiles?: { first_name: string; last_name: string };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "escalated">("all");
  const [startingConv, setStartingConv] = useState(false);
  const [members, setMembers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Charger les conversations avec les infos membres
        let query = supabase
          .from("whatsapp_conversations")
          .select("*, members!whatsapp_conversations_member_id_fkey(first_name, last_name), profiles!whatsapp_conversations_shepherd_id_fkey(first_name, last_name)")
          .order("started_at", { ascending: false })
          .limit(50);

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (prof && prof.role === "shepherd") {
          query = query.eq("shepherd_id", user.id);
        }

        const { data: convs } = await query;
        if (convs) setConversations(convs as Conversation[]);

        // Charger les membres pour démarrer une conversation
        let membersQuery = supabase
          .from("members")
          .select("id, first_name, last_name")
          .is("archived_at", null)
          .not("phone", "is", null)
          .order("first_name");

        if (prof && prof.role === "shepherd") {
          membersQuery = membersQuery.eq("shepherd_id", user.id);
        }

        const { data: mems } = await membersQuery;
        if (mems) setMembers(mems);
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [router, supabase]);

  const handleStartConversation = async () => {
    if (!selectedMember) return;
    setStartingConv(true);

    try {
      const response = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember,
          conversationType: "manual",
        }),
      });

      const data = await response.json();

      if (data.success && data.results?.[0]?.success) {
        // Recharger la liste
        const { data: newConvs } = await supabase
          .from("whatsapp_conversations")
          .select("*, members!whatsapp_conversations_member_id_fkey(first_name, last_name), profiles!whatsapp_conversations_shepherd_id_fkey(first_name, last_name)")
          .order("started_at", { ascending: false })
          .limit(50);

        if (newConvs) setConversations(newConvs as Conversation[]);
        setSelectedMember("");
      }
    } catch (err) {
      console.error("Erreur démarrage conversation:", err);
    } finally {
      setStartingConv(false);
    }
  };

  const filteredConversations = filter === "all"
    ? conversations
    : conversations.filter((c) => c.status === filter);

  const stats = {
    total: conversations.length,
    active: conversations.filter((c) => c.status === "active").length,
    completed: conversations.filter((c) => c.status === "completed").length,
    escalated: conversations.filter((c) => c.status === "escalated").length,
    needsAttention: conversations.filter((c) => c.needs_attention).length,
  };

  const typeLabels: Record<string, string> = {
    daily_checkin: "Quotidien",
    weekly_checkin: "Hebdomadaire",
    followup: "Suivi",
    manual: "Manuel",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    escalated: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const scoreColor = (score: number | null) => {
    if (!score) return "text-slate-400";
    if (score >= 7) return "text-emerald-600";
    if (score >= 4) return "text-amber-600";
    return "text-rose-600";
  };

  if (loading) return <PageLoader label="Chargement des conversations..." />;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3.5 border border-[#fea619]/40 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]">smart_toy</span>
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Agent IA Pastoral</span>
            </div>
            <h1 className="font-headline-md font-black text-2xl sm:text-3xl lg:text-4xl text-[#1e1b4b] tracking-tight">
              Conversations Spirituelles
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium max-w-2xl leading-relaxed">
              L&apos;agent IA contacte automatiquement vos fidèles pour prendre de leurs nouvelles et vérifier leur santé spirituelle.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, icon: "forum", color: "from-slate-600 to-slate-700" },
            { label: "Actives", value: stats.active, icon: "chat", color: "from-emerald-600 to-green-600" },
            { label: "Terminées", value: stats.completed, icon: "task_alt", color: "from-blue-600 to-indigo-600" },
            { label: "Escaladées", value: stats.escalated, icon: "warning", color: "from-rose-600 to-red-600" },
            { label: "Alertes", value: stats.needsAttention, icon: "notification_important", color: "from-amber-600 to-orange-600" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4 rounded-2xl text-center">
              <span className="material-symbols-outlined text-2xl bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, var(--color-${stat.color.split("-")[1]}-600))` }}>
                {stat.icon}
              </span>
              <div className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Démarrer une conversation avec... --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleStartConversation}
              disabled={!selectedMember || startingConv}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {startingConv ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              )}
              Démarrer
            </button>
          </div>

          <div className="flex gap-2">
            {(["all", "active", "completed", "escalated"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filter === f
                    ? "bg-[#1e1b4b] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Toutes" : f === "active" ? "Actives" : f === "completed" ? "Terminées" : "Escaladées"}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="space-y-4">
          {filteredConversations.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">forum</span>
              <p className="text-sm font-semibold text-slate-500 mt-2">Aucune conversation trouvée</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="glass-panel-interactive p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-all group"
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md ${
                  conv.needs_attention ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-indigo-600 to-purple-600"
                }`}>
                  {conv.members?.first_name?.[0] || "?"}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-black text-[#1e1b4b] group-hover:text-indigo-700 transition-colors">
                      {conv.members ? `${conv.members.first_name} ${conv.members.last_name}` : "Membre"}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[conv.status] || "bg-slate-50 text-slate-600"}`}>
                      {conv.status === "active" ? "Active" : conv.status === "completed" ? "Terminée" : conv.status === "escalated" ? "Escaladée" : conv.status}
                    </span>
                    {conv.needs_attention && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                        Alerte
                      </span>
                    )}
                  </div>

                  {conv.summary && (
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-2">{conv.summary}</p>
                  )}

                  {conv.attention_reason && conv.needs_attention && (
                    <p className="text-xs text-rose-600 font-bold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      {conv.attention_reason}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">tag</span>
                      {typeLabels[conv.conversation_type] || conv.conversation_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                      {conv.turn_count} messages
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(conv.started_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Score spirituel */}
                {conv.spiritual_health_score && (
                  <div className="text-center">
                    <div className={`text-2xl font-black ${scoreColor(conv.spiritual_health_score)}`}>
                      {conv.spiritual_health_score}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">Score</div>
                  </div>
                )}

                <span className="material-symbols-outlined text-slate-300 group-hover:text-indigo-500 transition-colors self-center">
                  chevron_right
                </span>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

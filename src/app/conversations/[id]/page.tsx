"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";

interface ConversationTurn {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  member_id: string;
  shepherd_id: string;
  status: string;
  conversation_type: string;
  started_at: string;
  completed_at: string | null;
  summary: string | null;
  spiritual_health_score: number | null;
  needs_attention: boolean;
  attention_reason: string | null;
  members?: { first_name: string; last_name: string; phone: string };
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadConversation() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Charger la conversation
        const { data: conv } = await supabase
          .from("whatsapp_conversations")
          .select("*, members!whatsapp_conversations_member_id_fkey(first_name, last_name, phone)")
          .eq("id", conversationId)
          .single();

        if (conv) setConversation(conv as Conversation);

        // Charger les tours de conversation
        const { data: turnsData } = await supabase
          .from("whatsapp_conversation_turns")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (turnsData) setTurns(turnsData as ConversationTurn[]);
      } catch (err) {
        console.error("Erreur chargement conversation:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversation();
  }, [conversationId, router, supabase]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.members?.phone) return;
    setSending(true);

    try {
      // Envoyer via WhatsApp
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: conversation.member_id,
          message: newMessage,
        }),
      });

      const data = await response.json();

      if (data.sent > 0) {
        // Enregistrer comme tour de conversation
        await supabase.from("whatsapp_conversation_turns").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: newMessage,
        });

        // Recharger les tours
        const { data: newTurns } = await supabase
          .from("whatsapp_conversation_turns")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (newTurns) setTurns(newTurns as ConversationTurn[]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!conversation) return;

    await supabase
      .from("whatsapp_conversations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    setConversation({ ...conversation, status: "completed", completed_at: new Date().toISOString() });
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

  if (loading) return <PageLoader label="Chargement de la conversation..." />;
  if (!conversation) return <div className="p-8 text-center">Conversation non trouvée</div>;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 rounded-3xl">
          <Link
            href="/conversations"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-700 transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Retour aux conversations
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                conversation.needs_attention ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-indigo-600 to-purple-600"
              }`}>
                {conversation.members?.first_name?.[0] || "?"}
              </div>
              <div>
                <h1 className="text-xl font-black text-[#1e1b4b]">
                  {conversation.members ? `${conversation.members.first_name} ${conversation.members.last_name}` : "Membre"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[conversation.status]}`}>
                    {conversation.status === "active" ? "Active" : conversation.status === "completed" ? "Terminée" : conversation.status}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Démarrée le {new Date(conversation.started_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {conversation.spiritual_health_score && (
                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className={`text-3xl font-black ${scoreColor(conversation.spiritual_health_score)}`}>
                    {conversation.spiritual_health_score}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">Score Spirituel</div>
                </div>
              )}

              {conversation.status === "active" && (
                <button
                  onClick={handleCloseConversation}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Clôturer
                </button>
              )}
            </div>
          </div>

          {/* Alerte si besoin d'attention */}
          {conversation.needs_attention && conversation.attention_reason && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <span className="material-symbols-outlined text-rose-600 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-bold text-rose-800">Cette conversation nécessite votre attention</p>
                <p className="text-xs text-rose-600 mt-1">{conversation.attention_reason}</p>
              </div>
            </div>
          )}

          {/* Résumé */}
          {conversation.summary && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <p className="text-xs font-bold text-indigo-800 mb-1">Résumé de la conversation</p>
              <p className="text-sm text-indigo-700 font-medium">{conversation.summary}</p>
            </div>
          )}
        </div>

        {/* Fil de conversation */}
        <div className="glass-panel p-6 rounded-3xl">
          <h2 className="text-lg font-black text-[#1e1b4b] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">chat_bubble</span>
            Messages échangés
          </h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {turns.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300">forum</span>
                <p className="text-sm font-semibold text-slate-500 mt-2">Aucun message échangé</p>
              </div>
            ) : (
              turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex ${turn.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      turn.role === "assistant"
                        ? "bg-white border border-slate-200 rounded-tl-sm"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">
                      {turn.role === "assistant" ? "Agent IA" : "Membre"}
                    </div>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{turn.content}</p>
                    <div className={`text-[10px] mt-2 ${turn.role === "assistant" ? "text-slate-400" : "text-white/60"}`}>
                      {new Date(turn.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone d'envoi de message (si conversation active) */}
        {conversation.status === "active" && (
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Envoyer un message manuel au membre..."
                rows={2}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all disabled:opacity-50 cursor-pointer self-end"
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">send</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

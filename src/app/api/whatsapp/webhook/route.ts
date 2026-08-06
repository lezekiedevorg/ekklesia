import { NextRequest, NextResponse } from "next/server";
import { isWhatsAppStubMode } from "@/lib/whatsapp/client";

/**
 * POST /api/whatsapp/webhook
 * Traite les messages WhatsApp entrants (réponses des membres).
 * En mode stub, retourne 200 OK sans traitement.
 *
 * Body:
 * - phone: string (numéro de l'expéditeur)
 * - message: string (contenu du message)
 * - whatsappMessageId?: string (ID du message WhatsApp)
 */
export async function POST(request: NextRequest) {
  try {
    // Mode stub : retourner 200 OK sans traitement
    if (isWhatsAppStubMode()) {
      console.log("[WHATSAPP STUB] Webhook reçu, traitement ignoré en mode stub");
      return NextResponse.json({
        success: true,
        action: "stub",
        message: "Webhook reçu mais WhatsApp est en mode stub",
      });
    }

    // Mode réel : charger les dépendances dynamiquement
    const { createClient } = await import("@/lib/supabase/server");
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/client");
    const { generateReply, generateConversationSummary } = await import("@/lib/ai/minimax-client");

    const supabase = await createClient();
    const body = await request.json();
    const { phone, message, whatsappMessageId } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "phone et message requis" }, { status: 400 });
    }

    // Nettoyer le numéro de téléphone
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");

    // Trouver le membre associé à ce numéro
    const { data: member } = await supabase
      .from("members")
      .select("id, first_name, last_name, phone, shepherd_id, status, current_class, consecutive_sundays_present, consecutive_absences, last_seen_date")
      .like("phone", `%${cleanPhone.slice(-8)}%`)
      .single();

    if (!member) {
      console.log("[Webhook] Membre non trouvé pour le numéro:", phone);
      return NextResponse.json({ success: true, action: "ignored", reason: "Membre non trouvé" });
    }

    // Enregistrer le message entrant
    await supabase.from("whatsapp_messages").insert({
      direction: "inbound",
      member_id: member.id,
      phone: cleanPhone,
      body: message,
      whatsapp_message_id: whatsappMessageId || null,
    });

    // Trouver la conversation active avec ce membre
    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("member_id", member.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      // Pas de conversation active, message simple enregistré
      return NextResponse.json({
        success: true,
        action: "recorded",
        reason: "Pas de conversation active",
      });
    }

    // Récupérer l'historique de la conversation
    const { data: turns } = await supabase
      .from("whatsapp_conversation_turns")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    const conversationHistory = turns || [];

    // Récupérer le contexte du membre
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attendance } = await supabase
      .from("attendance")
      .select("program_type")
      .eq("member_id", member.id)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("is_present", true);

    const { data: visits } = await supabase
      .from("member_visits")
      .select("visit_date, reason, notes")
      .eq("member_id", member.id)
      .order("visit_date", { ascending: false })
      .limit(3);

    const { data: prevConversations } = await supabase
      .from("whatsapp_conversations")
      .select("started_at, summary, spiritual_health_score")
      .eq("member_id", member.id)
      .eq("status", "completed")
      .neq("id", conversation.id)
      .order("started_at", { ascending: false })
      .limit(3);

    // Récupérer les settings de l'église
    const { data: churchSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "church_name")
      .single();

    const churchName = churchSetting?.value || "Eglise de Sagesse et Puissance";

    const context = {
      prenom: member.first_name,
      nom: member.last_name,
      statut: member.status,
      classe: member.current_class,
      presences_consecutives: member.consecutive_sundays_present,
      absences_consecutives: member.consecutive_absences,
      derniere_presence: member.last_seen_date,
      programmes_suivis: attendance?.map((a) => a.program_type) || [],
      taux_presence: attendance ? Math.round((attendance.length / 30) * 100) : 0,
      dernieres_visites: (visits || []).map((v) => ({
        date: v.visit_date,
        motif: v.reason,
        notes: v.notes,
      })),
      conversations_precedentes: (prevConversations || []).map((c) => ({
        date: c.started_at,
        resume: c.summary || "",
        score_spirituel: c.spiritual_health_score,
      })),
    };

    // Enregistrer le message de l'utilisateur comme tour
    await supabase.from("whatsapp_conversation_turns").insert({
      conversation_id: conversation.id,
      role: "user",
      content: message,
    });

    // Générer la réponse IA
    const aiResponse = await generateReply(
      context,
      conversationHistory.map((t) => ({ role: t.role as "assistant" | "user", content: t.content })),
      message,
      churchName
    );

    // Enregistrer la réponse IA comme tour
    await supabase.from("whatsapp_conversation_turns").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: aiResponse.message,
    });

    // Envoyer la réponse WhatsApp
    const sendResult = await sendWhatsAppMessage(member.phone, aiResponse.message);

    // Enregistrer le message sortant
    await supabase.from("whatsapp_messages").insert({
      direction: "outbound",
      member_id: member.id,
      shepherd_id: conversation.shepherd_id,
      phone: member.phone,
      body: aiResponse.message,
      status: sendResult.success ? "sent" : "failed",
      whatsapp_message_id: sendResult.messageId || null,
      conversation_id: conversation.id,
      error_message: sendResult.error || null,
    });

    // Si alerte détectée, marquer la conversation
    if (aiResponse.needsAttention) {
      await supabase
        .from("whatsapp_conversations")
        .update({
          needs_attention: true,
          attention_reason: aiResponse.attentionReason,
          escalated_at: new Date().toISOString(),
          status: "escalated",
        })
        .eq("id", conversation.id);

      // TODO: Envoyer notification au berger (WhatsApp ou notification push)
      console.log(`[ALERTE] Conversation ${conversation.id} nécessite attention: ${aiResponse.attentionReason}`);
    }

    // Si la conversation a assez de tours (>= 6), proposer un résumé
    const turnCount = conversationHistory.length + 1;
    if (turnCount >= 6 && conversation.conversation_type !== "manual") {
      // Générer le résumé de la conversation
      const allTurns = [
        ...conversationHistory,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: aiResponse.message },
      ];

      const summary = await generateConversationSummary(allTurns, `${member.first_name} ${member.last_name}`);

      // Mettre à jour la conversation avec le résumé
      await supabase
        .from("whatsapp_conversations")
        .update({
          summary: summary.summary,
          spiritual_health_score: summary.spiritualHealthScore,
          status: summary.needsAttention ? "escalated" : "completed",
          completed_at: summary.needsAttention ? null : new Date().toISOString(),
          needs_attention: summary.needsAttention,
          attention_reason: summary.attentionReason,
        })
        .eq("id", conversation.id);
    }

    return NextResponse.json({
      success: true,
      action: "replied",
      conversationId: conversation.id,
      needsAttention: aiResponse.needsAttention,
    });
  } catch (error: any) {
    console.error("[Webhook] Erreur traitement message entrant:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

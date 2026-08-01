import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { generateOpeningMessage } from "@/lib/ai/minimax-client";

/**
 * POST /api/conversations/start
 * Démarre une conversation IA avec un ou plusieurs membres.
 *
 * Body:
 * - memberId?: string (ID du membre)
 * - memberIds?: string[] (IDs de plusieurs membres)
 * - conversationType: 'daily_checkin' | 'weekly_checkin' | 'followup' | 'manual'
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["shepherd", "leader", "pastor", "admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, memberIds, conversationType = "manual" } = body;

    if (!memberId && (!memberIds || memberIds.length === 0)) {
      return NextResponse.json({ error: "Au moins un membre est requis" }, { status: 400 });
    }

    // Récupérer les settings de l'église
    const { data: churchSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "church_name")
      .single();

    const churchName = churchSetting?.value || "Eglise de Sagesse et Puissance";

    // Déterminer les membres à contacter
    const ids = memberId ? [memberId] : memberIds;
    const results = [];

    for (const mId of ids) {
      // Récupérer le membre avec son historique
      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("id", mId)
        .single();

      if (!member || !member.phone) {
        results.push({ memberId: mId, success: false, error: "Membre non trouvé ou sans téléphone" });
        continue;
      }

      // Vérifier s'il n'y a pas déjà une conversation active
      const { data: existingConv } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("member_id", mId)
        .eq("status", "active")
        .single();

      if (existingConv) {
        results.push({ memberId: mId, success: false, error: "Conversation déjà active" });
        continue;
      }

      // Récupérer les présences récentes (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendance } = await supabase
        .from("attendance")
        .select("program_type, date, is_present")
        .eq("member_id", mId)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .eq("is_present", true);

      // Récupérer les visites pastorales récentes
      const { data: visits } = await supabase
        .from("member_visits")
        .select("visit_date, reason, notes")
        .eq("member_id", mId)
        .order("visit_date", { ascending: false })
        .limit(3);

      // Récupérer les conversations précédentes
      const { data: prevConversations } = await supabase
        .from("whatsapp_conversations")
        .select("started_at, summary, spiritual_health_score")
        .eq("member_id", mId)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(3);

      // Construire le contexte pour l'IA (mapper les champs)
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

      // Générer le message d'ouverture via MiniMax
      const aiResponse = await generateOpeningMessage(context, churchName);

      // Créer la conversation en base
      const { data: conversation } = await supabase
        .from("whatsapp_conversations")
        .insert({
          member_id: mId,
          shepherd_id: user.id,
          status: "active",
          conversation_type: conversationType,
        })
        .select()
        .single();

      if (!conversation) {
        results.push({ memberId: mId, success: false, error: "Erreur création conversation" });
        continue;
      }

      // Enregistrer le message IA comme premier tour
      await supabase.from("whatsapp_conversation_turns").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: aiResponse.message,
      });

      // Envoyer le message WhatsApp
      const sendResult = await sendWhatsAppMessage(member.phone, aiResponse.message);

      // Enregistrer le message dans whatsapp_messages
      await supabase.from("whatsapp_messages").insert({
        direction: "outbound",
        member_id: mId,
        shepherd_id: user.id,
        phone: member.phone,
        body: aiResponse.message,
        status: sendResult.success ? "sent" : "failed",
        whatsapp_message_id: sendResult.messageId || null,
        conversation_id: conversation.id,
        error_message: sendResult.error || null,
      });

      results.push({
        memberId: mId,
        name: `${member.first_name} ${member.last_name}`,
        conversationId: conversation.id,
        success: sendResult.success,
        error: sendResult.error,
      });

      // Rate limiting
      if (ids.indexOf(mId) < ids.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      started: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error("[API] Erreur démarrage conversation:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { generateOpeningMessage } from "@/lib/ai/minimax-client";

/**
 * POST /api/cron/daily-conversations
 * Démarre automatiquement des conversations quotidiennes avec les membres.
 * À appeler via un cron job (Supabase pg_cron, GitHub Actions, ou autre).
 *
 * Body (optionnel):
 * - cronSecret: string (clé secrète pour sécuriser l'appel)
 * - shepherdId?: string (limiter à un berger spécifique)
 * - maxConversations?: number (nombre max de conversations à lancer, défaut: 10)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier le secret cron (sécurité)
    const body = await request.json().catch(() => ({}));
    const { cronSecret, shepherdId, maxConversations = 10 } = body;

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les settings de l'église
    const { data: churchSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "church_name")
      .single();

    const churchName = churchSetting?.value || "Eglise de Sagesse et Puissance";

    // Trouver les membres éligibles pour une conversation quotidienne
    // Critères: nouveau converti ou en intégration, pas de conversation active
    let membersQuery = supabase
      .from("members")
      .select("id, first_name, last_name, phone, status, current_class, consecutive_sundays_present, consecutive_absences, last_seen_date, shepherd_id")
      .is("archived_at", null)
      .not("phone", "is", null)
      .in("status", ["new_convert", "in_integration"])
      .limit(maxConversations);

    if (shepherdId) {
      membersQuery = membersQuery.eq("shepherd_id", shepherdId);
    }

    const { data: members, error: membersError } = await membersQuery;

    if (membersError || !members || members.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun membre éligible trouvé",
        conversations: 0,
      });
    }

    // Filtrer ceux qui n'ont pas déjà une conversation active
    const { data: activeConversations } = await supabase
      .from("whatsapp_conversations")
      .select("member_id")
      .eq("status", "active");

    const activeMemberIds = new Set(activeConversations?.map((c) => c.member_id) || []);
    const eligibleMembers = members.filter((m) => !activeMemberIds.has(m.id));

    if (eligibleMembers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tous les membres éligibles ont déjà une conversation active",
        conversations: 0,
      });
    }

    const results = [];

    for (const member of eligibleMembers) {
      try {
        // Récupérer les présences récentes
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: attendance } = await supabase
          .from("attendance")
          .select("program_type, date, is_present")
          .eq("member_id", member.id)
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
          .eq("is_present", true);

        // Récupérer les visites pastorales récentes
        const { data: visits } = await supabase
          .from("member_visits")
          .select("visit_date, reason, notes")
          .eq("member_id", member.id)
          .order("visit_date", { ascending: false })
          .limit(3);

        // Récupérer les conversations précédentes
        const { data: prevConversations } = await supabase
          .from("whatsapp_conversations")
          .select("started_at, summary, spiritual_health_score")
          .eq("member_id", member.id)
          .eq("status", "completed")
          .order("started_at", { ascending: false })
          .limit(3);

        // Construire le contexte (mapper les champs)
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

        // Générer le message d'ouverture
        const aiResponse = await generateOpeningMessage(context, churchName);

        // Créer la conversation
        const { data: conversation } = await supabase
          .from("whatsapp_conversations")
          .insert({
            member_id: member.id,
            shepherd_id: member.shepherd_id,
            status: "active",
            conversation_type: "daily_checkin",
          })
          .select()
          .single();

        if (!conversation) continue;

        // Enregistrer le tour IA
        await supabase.from("whatsapp_conversation_turns").insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: aiResponse.message,
        });

        // Envoyer le message
        const sendResult = await sendWhatsAppMessage(member.phone, aiResponse.message);

        // Enregistrer le message
        await supabase.from("whatsapp_messages").insert({
          direction: "outbound",
          member_id: member.id,
          shepherd_id: member.shepherd_id,
          phone: member.phone,
          body: aiResponse.message,
          status: sendResult.success ? "sent" : "failed",
          whatsapp_message_id: sendResult.messageId || null,
          conversation_id: conversation.id,
          error_message: sendResult.error || null,
        });

        results.push({
          memberId: member.id,
          name: `${member.first_name} ${member.last_name}`,
          conversationId: conversation.id,
          success: sendResult.success,
          error: sendResult.error,
        });

        // Rate limiting: 3 secondes entre chaque conversation
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error: any) {
        results.push({
          memberId: member.id,
          name: `${member.first_name} ${member.last_name}`,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      conversations: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error("[Cron] Erreur conversations quotidiennes:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/cron/weekly-report
 * Génère le rapport hebdomadaire des conversations IA.
 * À appeler chaque lundi matin.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier le secret cron
    const body = await request.json().catch(() => ({}));
    const { cronSecret, shepherdId } = body;

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Définir la période (7 derniers jours)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const periodStart = startDate.toISOString().split("T")[0];
    const periodEnd = endDate.toISOString().split("T")[0];

    // Construire la requête pour les conversations terminées de la semaine
    let query = supabase
      .from("whatsapp_conversations")
      .select("id, shepherd_id, status, spiritual_health_score, needs_attention, attention_reason, members!whatsapp_conversations_member_id_fkey(first_name, last_name)")
      .gte("started_at", startDate.toISOString())
      .lte("started_at", endDate.toISOString());

    if (shepherdId) {
      query = query.eq("shepherd_id", shepherdId);
    }

    const { data: conversations } = await query;

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune conversation cette semaine",
      });
    }

    // Grouper par berger
    const byShepherd: Record<string, typeof conversations> = {};
    for (const conv of conversations) {
      if (!byShepherd[conv.shepherd_id]) {
        byShepherd[conv.shepherd_id] = [];
      }
      byShepherd[conv.shepherd_id].push(conv);
    }

    const reports = [];

    for (const [sId, convs] of Object.entries(byShepherd)) {
      const positive = convs.filter((c) => c.spiritual_health_score && c.spiritual_health_score >= 7).length;
      const neutral = convs.filter((c) => c.spiritual_health_score && c.spiritual_health_score >= 4 && c.spiritual_health_score < 7).length;
      const attention = convs.filter((c) => c.spiritual_health_score && c.spiritual_health_score < 4).length;
      const critical = convs.filter((c) => c.needs_attention).length;

      const escalatedMembers = convs
        .filter((c) => c.needs_attention)
        .map((c) => ({
          member_id: c.id,
          name: c.members ? `${(c.members as any).first_name} ${(c.members as any).last_name}` : "Inconnu",
          reason: c.attention_reason || "Besoin d'attention",
        }));

      // Générer le résumé
      const summary = `Semaine du ${periodStart} au ${periodEnd}: ${convs.length} conversations. ` +
        `${positive} positives, ${neutral} neutres, ${attention} à surveiller. ` +
        `${critical} alerte(s) nécessitant une intervention.`;

      // Enregistrer le rapport
      const { data: report } = await supabase
        .from("whatsapp_reports")
        .insert({
          shepherd_id: sId,
          report_type: "weekly",
          period_start: periodStart,
          period_end: periodEnd,
          total_conversations: convs.length,
          positive_count: positive,
          neutral_count: neutral,
          attention_count: attention,
          critical_count: critical,
          top_prayer_topics: [],
          escalated_members: escalatedMembers,
          summary,
        })
        .select()
        .single();

      reports.push(report);
    }

    return NextResponse.json({
      success: true,
      reportsGenerated: reports.length,
      totalConversations: conversations.length,
    });
  } catch (error: any) {
    console.error("[Cron] Erreur rapport hebdomadaire:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

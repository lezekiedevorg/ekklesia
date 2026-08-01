import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

/**
 * POST /api/whatsapp/send
 * Envoie un message WhatsApp à un ou plusieurs membres.
 *
 * Body:
 * - memberId?: string (ID du membre)
 * - memberIds?: string[] (IDs de plusieurs membres)
 * - phone?: string (numéro direct si pas de membre)
 * - message: string (contenu du message)
 * - templateId?: string (ID du template utilisé)
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

    // Vérifier le rôle (seuls shepherd, pastor, admin peuvent envoyer)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["shepherd", "leader", "pastor", "admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, memberIds, phone, message, templateId } = body;

    if (!message) {
      return NextResponse.json({ error: "Le message est requis" }, { status: 400 });
    }

    // Déterminer les destinataires
    let targets: { id: string; phone: string; first_name: string; last_name: string }[] = [];

    if (memberId) {
      // Un seul membre
      const { data: member } = await supabase
        .from("members")
        .select("id, phone, first_name, last_name")
        .eq("id", memberId)
        .single();

      if (member && member.phone) {
        targets = [member];
      }
    } else if (memberIds && memberIds.length > 0) {
      // Plusieurs membres
      const { data: members } = await supabase
        .from("members")
        .select("id, phone, first_name, last_name")
        .in("id", memberIds)
        .not("phone", "is", null);

      if (members) {
        targets = members;
      }
    } else if (phone) {
      // Numéro direct
      targets = [{ id: "direct", phone, first_name: "", last_name: "" }];
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { error: "Aucun destinataire avec numéro de téléphone valide" },
        { status: 400 }
      );
    }

    // Envoyer les messages avec rate limiting (1 msg toutes les 2 secondes)
    const results = [];
    for (const target of targets) {
      // Personnaliser le message
      let personalizedMessage = message
        .replace(/{prenom}/g, target.first_name)
        .replace(/{nom}/g, target.last_name)
        .replace(/{nom_complet}/g, `${target.first_name} ${target.last_name}`)
        .replace(/{berger}/g, `${profile.first_name} ${profile.last_name}`);

      // Envoyer
      const result = await sendWhatsAppMessage(target.phone, personalizedMessage);

      // Enregistrer dans la base
      const { data: savedMessage } = await supabase
        .from("whatsapp_messages")
        .insert({
          direction: "outbound",
          member_id: target.id !== "direct" ? target.id : null,
          shepherd_id: user.id,
          phone: target.phone,
          body: personalizedMessage,
          status: result.success ? "sent" : "failed",
          whatsapp_message_id: result.messageId || null,
          template_id: templateId || null,
          error_message: result.error || null,
        })
        .select()
        .single();

      results.push({
        memberId: target.id,
        name: `${target.first_name} ${target.last_name}`.trim(),
        phone: target.phone,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        dbId: savedMessage?.id,
      });

      // Rate limiting: attendre 2 secondes entre chaque envoi
      if (targets.indexOf(target) < targets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error("[API] Erreur envoi WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getWhatsAppClient, isWhatsAppReady, getQRCode } from "@/lib/whatsapp/client";

/**
 * GET /api/whatsapp/qr
 * Retourne le QR code WhatsApp pour connexion, ou le statut si déjà connecté.
 */
export async function GET() {
  try {
    // Initialiser le client si pas encore fait
    getWhatsAppClient();

    const ready = isWhatsAppReady();
    const qr = getQRCode();

    if (ready) {
      return NextResponse.json({
        status: "connected",
        message: "WhatsApp est connecté et prêt",
      });
    }

    if (qr) {
      return NextResponse.json({
        status: "qr_ready",
        qrCode: qr,
        message: "Scannez ce QR code avec WhatsApp",
      });
    }

    return NextResponse.json({
      status: "initializing",
      message: "Connexion en cours... Veuillez patienter.",
    });
  } catch (error: any) {
    console.error("[API] Erreur QR WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

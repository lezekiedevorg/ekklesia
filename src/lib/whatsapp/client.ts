import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode";

let client: Client | null = null;
let isReady = false;
let qrCodeData: string | null = null;

/**
 * Initialise ou retourne le client WhatsApp singleton.
 * Le client utilise LocalAuth pour persister la session.
 */
export function getWhatsAppClient(): Client {
  if (client) return client;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log("[WhatsApp] QR Code reçu, scannez-le avec votre téléphone");
    qrcode.toDataURL(qr).then((url) => {
      qrCodeData = url;
    });
  });

  client.on("ready", () => {
    console.log("[WhatsApp] Client prêt et connecté");
    isReady = true;
    qrCodeData = null;
  });

  client.on("disconnected", (reason) => {
    console.log("[WhatsApp] Client déconnecté:", reason);
    isReady = false;
    client = null;
  });

  client.on("auth_failure", (msg) => {
    console.error("[WhatsApp] Échec d'authentification:", msg);
    isReady = false;
    client = null;
  });

  client.initialize();
  return client;
}

/**
 * Vérifie si le client WhatsApp est prêt.
 */
export function isWhatsAppReady(): boolean {
  return isReady;
}

/**
 * Retourne le QR code en base64 si disponible (pour affichage frontend).
 */
export function getQRCode(): string | null {
  return qrCodeData;
}

/**
 * Envoie un message WhatsApp à un numéro de téléphone.
 * @param phone - Numéro au format international (ex: +22501020304)
 * @param message - Contenu du message
 * @returns L'ID du message envoyé
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const waClient = getWhatsAppClient();

  if (!isReady) {
    return { success: false, error: "Client WhatsApp non connecté" };
  }

  try {
    // Formater le numéro (supprimer les espaces, tirets, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");

    // WhatsApp attend le format: numéro@c.us
    const chatId = `${cleanPhone}@c.us`;

    // Vérifier que le numéro existe sur WhatsApp
    const isRegistered = await waClient.isRegisteredUser(chatId);
    if (!isRegistered) {
      return {
        success: false,
        error: `Le numéro ${phone} n'est pas enregistré sur WhatsApp`,
      };
    }

    // Envoyer le message
    const sentMessage: Message = await waClient.sendMessage(chatId, message);

    return {
      success: true,
      messageId: sentMessage.id._serialized,
    };
  } catch (error: any) {
    console.error("[WhatsApp] Erreur envoi message:", error);
    return {
      success: false,
      error: error.message || "Erreur inconnue lors de l'envoi",
    };
  }
}

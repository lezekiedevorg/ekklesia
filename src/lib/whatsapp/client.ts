import qrcode from "qrcode";

const isWhatsAppEnabled = process.env.WHATSAPP_ENABLED === "true";

let client: any = null;
let isReady = false;
let qrCodeData: string | null = null;

/**
 * Initialise ou retourne le client WhatsApp singleton.
 * En mode stub (WHATSAPP_ENABLED=false), retourne un objet mock.
 */
export function getWhatsAppClient(): any {
  if (client) return client;

  // Mode stub : retourner un objet mock sans whatsapp-web.js
  if (!isWhatsAppEnabled) {
    client = {
      isReady: () => true,
      on: () => {},
      destroy: async () => {
        console.log("[WHATSAPP STUB] destroy() appelé");
      },
      send: async ({ chatId, text }: { chatId: string; text: string }) => {
        console.log(`[WHATSAPP STUB] Would send to ${chatId}: ${text}`);
        return { id: `mock_${Date.now()}`, ack: 1 };
      },
      sendMessage: async (to: string, text: string) => {
        console.log(`[WHATSAPP STUB] Would send "${text}" to ${to}`);
        return { id: `mock_${Date.now()}` };
      },
      isRegisteredUser: async () => true,
      initialize: async () => {
        console.log("[WHATSAPP STUB] initialize() appelé");
      },
    };
    isReady = true;
    return client;
  }

  // Mode réel : charger whatsapp-web.js dynamiquement
  const { Client, LocalAuth } = require("whatsapp-web.js");
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

  client.on("qr", (qr: string) => {
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

  client.on("disconnected", (reason: string) => {
    console.log("[WhatsApp] Client déconnecté:", reason);
    isReady = false;
    client = null;
  });

  client.on("auth_failure", (msg: string) => {
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

    // Mode stub : retourner succès directement
    if (!isWhatsAppEnabled) {
      console.log(`[WHATSAPP STUB] Would send to ${chatId}: ${message}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    }

    // Mode réel : vérifier que le numéro existe sur WhatsApp
    const isRegistered = await waClient.isRegisteredUser(chatId);
    if (!isRegistered) {
      return {
        success: false,
        error: `Le numéro ${phone} n'est pas enregistré sur WhatsApp`,
      };
    }

    // Envoyer le message
    const sentMessage = await waClient.sendMessage(chatId, message);

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

/**
 * Retourne le mode actuel (stub ou réel).
 */
export function isWhatsAppStubMode(): boolean {
  return !isWhatsAppEnabled;
}

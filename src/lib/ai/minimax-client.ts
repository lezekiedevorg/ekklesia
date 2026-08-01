/**
 * Client API MiniMax pour l'agent IA pastoral.
 * API compatible OpenAI - utilise le format chat completions.
 */

const MINIMAX_API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";

interface MiniMaxMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MiniMaxResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
}

interface ConversationContext {
  prenom: string;
  nom: string;
  statut: string;
  classe: string;
  presences_consecutives: number;
  absences_consecutives: number;
  derniere_presence: string | null;
  programmes_suivis?: string[];
  taux_presence?: number;
  dernieres_visites?: {
    date: string;
    motif: string;
    notes: string | null;
  }[];
  conversations_precedentes?: {
    date: string;
    resume: string;
    score_spirituel: number | null;
  }[];
}

/**
 * Envoie une requête à l'API MiniMax.
 */
async function callMiniMaxAPI(
  messages: MiniMaxMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{ content: string; usage: { input: number; output: number } }> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;
  const model = options?.model || process.env.MINIMAX_MODEL || "abab6.5s-chat";

  if (!apiKey || !groupId) {
    throw new Error("MINIMAX_API_KEY et MINIMAX_GROUP_ID doivent être configurés");
  }

  const response = await fetch(`${MINIMAX_API_URL}?GroupId=${groupId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API MiniMax (${response.status}): ${errorText}`);
  }

  const data: MiniMaxResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error("Réponse MiniMax vide");
  }

  return {
    content: data.choices[0].message.content,
    usage: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0,
    },
  };
}

/**
 * Génère le prompt système pour une conversation pastorale.
 */
function buildPastoralSystemPrompt(context: ConversationContext, churchName: string): string {
  const statusLabels: Record<string, string> = {
    new_convert: "Nouveau Converti",
    in_integration: "En Intégration",
    active: "Membre Actif",
    member: "Membre Confirmé",
    new: "Nouveau",
    absent_to_relaunch: "À Relancer",
  };

  const classLabels: Record<string, string> = {
    none: "Aucune classe",
    tuesday_class: "Classe d'affermissement (Mardi)",
    wednesday_class: "Classe de fondements (Mercredi)",
    completed: "Formation Terminée",
  };

  let prompt = `Tu es l'assistant pastoral de l'église "${churchName}". Tu contactes ${context.prenom} ${context.nom} pour prendre de ses nouvelles et l'accompagner spirituellement.

CONTEXTE DU MEMBRE:
- Nom: ${context.prenom} ${context.nom}
- Statut: ${statusLabels[context.statut] || context.statut}
- Classe: ${classLabels[context.classe] || context.classe}
- Présences consécutives: ${context.presences_consecutives}
- Absences consécutives: ${context.absences_consecutives}
- Dernière présence: ${context.derniere_presence || "Inconnue"}`;

  if (context.taux_presence !== undefined) {
    prompt += `\n- Taux de présence (30j): ${context.taux_presence}%`;
  }

  if (context.programmes_suivis && context.programmes_suivis.length > 0) {
    prompt += `\n- Programmes suivis: ${context.programmes_suivis.join(", ")}`;
  }

  if (context.dernieres_visites && context.dernieres_visites.length > 0) {
    prompt += `\n\nDERNIÈRES VISITES PASTORALES:`;
    for (const visite of context.dernieres_visites) {
      prompt += `\n- ${visite.date}: ${visite.motif}`;
      if (visite.notes) prompt += ` (${visite.notes})`;
    }
  }

  if (context.conversations_precedentes && context.conversations_precedentes.length > 0) {
    prompt += `\n\nCONVERSATIONS PRÉCÉDENTES:`;
    for (const conv of context.conversations_precedentes) {
      prompt += `\n- ${conv.date}: ${conv.resume}`;
      if (conv.score_spirituel) prompt += ` [Score: ${conv.score_spirituel}/10]`;
    }
  }

  prompt += `

RÈGLES DE CONVERSATION:
1. Sois chaleureux, bienveillant et pastoral dans ton approche
2. Commence par saluer chaleureusement et demander comment va la personne
3. Pose des questions sur: vie de prière, méditation de la Parole, besoins personnels
4. Adapte ton message selon le contexte (nouveau converti vs membre confirmé)
5. Si la personne est absente depuis longtemps, montre de la compassion sans jugement
6. Si la personne exprime une difficulté, montre de l'empathie et propose ton soutien
7. Termine toujours en demandant comment tu peux prier pour elle
8. Sois concis: 2-3 phrases maximum par message

DÉTECTION D'ALERTES (NEEDS_ATTENTION):
Si la personne mentionne l'un de ces sujets, tu dois l'indiquer dans ta réponse avec [ALERT:type]:
- Dépression, tristesse profonde, idées noires → [ALERT:depression]
- Urgence médicale, hospitalisation → [ALERT:medical]
- Conflit familial grave, violence → [ALERT:family]
- Problèmes financiers critiques → [ALERT:financial]
- Doute sur la foi, éloignement volontaire → [ALERT:faith]
- Tout autre besoin urgent → [ALERT:urgent]

Réponds TOUJOURS en français. Utilise un ton pastoral et bienveillant.`;

  return prompt;
}

/**
 * Génère le message d'ouverture d'une conversation.
 */
export async function generateOpeningMessage(
  context: ConversationContext,
  churchName: string = "Eglise de Sagesse et Puissance"
): Promise<{ message: string; usage: { input: number; output: number } }> {
  const systemPrompt = buildPastoralSystemPrompt(context, churchName);

  const messages: MiniMaxMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: "Génère le premier message d'ouverture pour commencer la conversation avec ce membre. Sois chaleureux et pose une question ouverte.",
    },
  ];

  const result = await callMiniMaxAPI(messages, { temperature: 0.8 });
  return { message: result.content, usage: result.usage };
}

/**
 * Génère la réponse de l'agent IA à un message du membre.
 */
export async function generateReply(
  context: ConversationContext,
  conversationHistory: { role: "assistant" | "user"; content: string }[],
  userMessage: string,
  churchName: string = "Eglise de Sagesse et Puissance"
): Promise<{
  message: string;
  needsAttention: boolean;
  attentionType?: string;
  attentionReason?: string;
  usage: { input: number; output: number };
}> {
  const systemPrompt = buildPastoralSystemPrompt(context, churchName);

  const messages: MiniMaxMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((turn) => ({
      role: turn.role as "assistant" | "user",
      content: turn.content,
    })),
    { role: "user", content: userMessage },
  ];

  const result = await callMiniMaxAPI(messages, { temperature: 0.7 });

  // Détecter les alertes dans la réponse
  const alertMatch = result.content.match(/\[ALERT:(\w+)(?::([^\]]+))?\]/);
  let needsAttention = false;
  let attentionType: string | undefined;
  let attentionReason: string | undefined;

  if (alertMatch) {
    needsAttention = true;
    attentionType = alertMatch[1];
    attentionReason = alertMatch[2] || `Alerte détectée: ${alertMatch[1]}`;
    // Nettoyer le message de la balise d'alerte
    result.content = result.content.replace(/\[ALERT:\w+(?::[^\]]+)?\]/, "").trim();
  }

  return {
    message: result.content,
    needsAttention,
    attentionType,
    attentionReason,
    usage: result.usage,
  };
}

/**
 * Génère un résumé de conversation pour le rapport.
 */
export async function generateConversationSummary(
  conversationTurns: { role: string; content: string }[],
  memberName: string
): Promise<{
  summary: string;
  spiritualHealthScore: number;
  status: "positive" | "neutral" | "attention" | "critical";
  prayerTopics: string[];
  needsAttention: boolean;
  attentionReason?: string;
}> {
  const messages: MiniMaxMessage[] = [
    {
      role: "system",
      content: `Tu es un analyste pastoral. Analyse cette conversation entre un assistant IA et un membre d'église et génère un rapport structuré.

Retourne UNIQUEMENT un JSON valide avec cette structure:
{
  "summary": "Résumé en 2-3 phrases",
  "spiritualHealthScore": 1-10,
  "status": "positive|neutral|attention|critical",
  "prayerTopics": ["sujet1", "sujet2"],
  "needsAttention": true/false,
  "attentionReason": "raison si besoin d'attention"
}`,
    },
    {
      role: "user",
      content: `Conversation avec ${memberName}:\n\n${conversationTurns.map((t) => `[${t.role}]: ${t.content}`).join("\n")}`,
    },
  ];

  const result = await callMiniMaxAPI(messages, {
    temperature: 0.3,
    maxTokens: 512,
  });

  try {
    // Extraire le JSON de la réponse (peut contenir du texte avant/après)
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Pas de JSON trouvé");
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback si le parsing échoue
    return {
      summary: result.content.slice(0, 200),
      spiritualHealthScore: 5,
      status: "neutral" as const,
      prayerTopics: [],
      needsAttention: false,
    };
  }
}

-- ============================================================
-- Migration: WhatsApp Integration + AI Agent Conversations
-- Date: 2026-08-01
-- ============================================================

-- 1. Templates de messages WhatsApp
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('program_reminder', 'announcement', 'custom', 'conversation_starter', 'followup')),
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par catégorie
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category) WHERE is_active = true;

-- 2. Messages WhatsApp envoyés/reçus
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  shepherd_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone VARCHAR(50) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  whatsapp_message_id VARCHAR(100),
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  conversation_id UUID, -- FK ajoutée après création de whatsapp_conversations
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour historique par membre et par berger
CREATE INDEX idx_whatsapp_messages_member ON whatsapp_messages(member_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_shepherd ON whatsapp_messages(shepherd_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone, created_at DESC);

-- 3. Conversations IA par membre
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  shepherd_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated', 'cancelled')),
  conversation_type VARCHAR(30) NOT NULL CHECK (conversation_type IN ('daily_checkin', 'weekly_checkin', 'followup', 'manual')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  turn_count INTEGER DEFAULT 0,
  summary TEXT,
  spiritual_health_score INTEGER CHECK (spiritual_health_score >= 1 AND spiritual_health_score <= 10),
  needs_attention BOOLEAN DEFAULT false,
  attention_reason TEXT,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout de la FK manquante sur whatsapp_messages
ALTER TABLE whatsapp_messages
  ADD CONSTRAINT fk_whatsapp_messages_conversation
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE SET NULL;

-- Index pour conversations actives et par berger
CREATE INDEX idx_whatsapp_conversations_active ON whatsapp_conversations(status, shepherd_id) WHERE status = 'active';
CREATE INDEX idx_whatsapp_conversations_member ON whatsapp_conversations(member_id, created_at DESC);
CREATE INDEX idx_whatsapp_conversations_attention ON whatsapp_conversations(needs_attention, shepherd_id) WHERE needs_attention = true;

-- 4. Tours de conversation (messages échangés dans une conversation IA)
CREATE TABLE whatsapp_conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('assistant', 'user', 'system')),
  content TEXT NOT NULL,
  whatsapp_message_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour récupérer les tours d'une conversation dans l'ordre
CREATE INDEX idx_conversation_turns_conv ON whatsapp_conversation_turns(conversation_id, created_at ASC);

-- 5. Rapports hebdomadaires de conversations
CREATE TABLE whatsapp_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shepherd_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  attention_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  top_prayer_topics JSONB DEFAULT '[]'::jsonb,
  escalated_members JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour rapports par berger
CREATE INDEX idx_whatsapp_reports_shepherd ON whatsapp_reports(shepherd_id, created_at DESC);
CREATE INDEX idx_whatsapp_reports_period ON whatsapp_reports(report_type, period_start, period_end);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_reports ENABLE ROW LEVEL SECURITY;

-- Templates: lecture par tous les authentifiés, écriture par pastor/admin
CREATE POLICY templates_read_authenticated ON whatsapp_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY templates_pastor_all ON whatsapp_templates
  FOR ALL TO authenticated
  USING (is_pastor() OR created_by = auth.uid())
  WITH CHECK (is_pastor() OR created_by = auth.uid());

-- Messages: shepherd voit ses messages, pastor voit tout
CREATE POLICY messages_shepherd_all ON whatsapp_messages
  FOR ALL TO authenticated
  USING (shepherd_id = auth.uid())
  WITH CHECK (shepherd_id = auth.uid());

CREATE POLICY messages_pastor_all ON whatsapp_messages
  FOR ALL TO authenticated
  USING (is_pastor())
  WITH CHECK (is_pastor());

-- Conversations: shepherd voit ses conversations, pastor voit tout
CREATE POLICY conversations_shepherd_all ON whatsapp_conversations
  FOR ALL TO authenticated
  USING (shepherd_id = auth.uid())
  WITH CHECK (shepherd_id = auth.uid());

CREATE POLICY conversations_pastor_all ON whatsapp_conversations
  FOR ALL TO authenticated
  USING (is_pastor())
  WITH CHECK (is_pastor());

-- Tours de conversation: accès via la conversation parente
CREATE POLICY turns_shepherd_read ON whatsapp_conversation_turns
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM whatsapp_conversations WHERE shepherd_id = auth.uid()
    )
  );

CREATE POLICY turns_pastor_all ON whatsapp_conversation_turns
  FOR ALL TO authenticated
  USING (is_pastor())
  WITH CHECK (is_pastor());

-- Rapports: shepherd voit ses rapports, pastor voit tout
CREATE POLICY reports_shepherd_read ON whatsapp_reports
  FOR SELECT TO authenticated
  USING (shepherd_id = auth.uid());

CREATE POLICY reports_pastor_all ON whatsapp_reports
  FOR ALL TO authenticated
  USING (is_pastor())
  WITH CHECK (is_pastor());

-- ============================================================
-- Trigger: Mettre à jour last_message_at et turn_count
-- ============================================================

CREATE OR REPLACE FUNCTION update_conversation_on_turn()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET
    last_message_at = NEW.created_at,
    turn_count = turn_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_conversation_on_turn
  AFTER INSERT ON whatsapp_conversation_turns
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_turn();

-- ============================================================
-- Trigger: Mettre à jour updated_at sur templates
-- ============================================================

CREATE OR REPLACE FUNCTION update_whatsapp_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_templates_timestamp();

-- ============================================================
-- Seed: Templates par défaut
-- ============================================================

INSERT INTO whatsapp_templates (name, category, body) VALUES
  (
    'Rappel Culte Dominical',
    'program_reminder',
    'Bonjour {prenom} ! 🙏\n\nN''oubliez pas le culte de ce dimanche à l''église. Que Dieu vous bénisse et vous garde en bonne santé pour y assister.\n\nÀ dimanche !\n{berger}'
  ),
  (
    'Rappel Classe Mardi',
    'program_reminder',
    'Bonjour {prenom} ! 📘\n\nLa classe d''affermissement a lieu demain mardi. C''est une belle occasion de grandir dans la foi.\n\nQue le Seigneur vous fortifie !\n{berger}'
  ),
  (
    'Rappel Classe Mercredi',
    'program_reminder',
    'Bonjour {prenom} ! 📗\n\nLa classe de fondements a lieu demain mercredi. Venez enrichir votre connaissance de la Parole.\n\nDieu vous bénisse !\n{berger}'
  ),
  (
    'Rappel Prière Jeudi',
    'program_reminder',
    'Bonjour {prenom} ! 🌐\n\nN''oubliez pas la prière en ligne de ce jeudi. Rejoignons-nous dans la prière.\n\nQue Dieu vous accompagne !\n{berger}'
  ),
  (
    'Rappel Veillée Vendredi',
    'program_reminder',
    'Bonjour {prenom} ! 🔥\n\nLa veillée de prière a lieu ce vendredi. Venez recevoir la puissance de Dieu.\n\nBénédiction !\n{berger}'
  ),
  (
    'Conversation Spirituelle - Ouverture',
    'conversation_starter',
    'Bonjour {prenom} ! 😊\n\nJe suis l''assistant pastoral de votre église. Je prends de vos nouvelles aujourd''hui.\n\nComment allez-vous ? Comment se passe votre vie spirituelle cette semaine ?'
  ),
  (
    'Suivi après absence',
    'followup',
    'Bonjour {prenom} ! 💝\n\nNous avons remarqué votre absence récente aux programmes de l''église. Nous pensons à vous et prions pour vous.\n\nY a-t-il quelque chose dont vous avez besoin ? Comment puis-je vous aider ?\n\n{berger}'
  );

-- Migration: Add full shepherd report fields matching official PDF (rapport_du_berger_2026.pdf)
-- Q = Quotidien, I = Intermittence

ALTER TABLE shepherd_activities 
  -- 1. Vie personnelle (Prière, Jeûne, Méditation, Ecoute de la parole)
  ADD COLUMN IF NOT EXISTS prayer_i_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fasting_q_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fasting_i_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meditation_i_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS word_listening_q_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS word_listening_i_done BOOLEAN NOT NULL DEFAULT FALSE,

  -- 2. Travail du berger (Encadrement, Visite, Entretien téléphonique + quantitative metrics)
  ADD COLUMN IF NOT EXISTS mentoring_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visits_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_calls_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_calls_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS personal_invites_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_invites_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovered_souls_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS message_listeners_count INTEGER NOT NULL DEFAULT 0,

  -- 3. Programme d'église (Shepherd personal attendance)
  ADD COLUMN IF NOT EXISTS shepherd_attendance_tuesday BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shepherd_attendance_wednesday BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shepherd_attendance_thursday BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shepherd_attendance_friday BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shepherd_attendance_sunday BOOLEAN NOT NULL DEFAULT FALSE,

  -- 4. Activités mensuelles
  ADD COLUMN IF NOT EXISTS monthly_pre_service_intercession BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS monthly_anagkazo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS monthly_group_evangelization BOOLEAN NOT NULL DEFAULT FALSE,

  -- 5. Chaînes de prière
  ADD COLUMN IF NOT EXISTS prayer_chain_done BOOLEAN NOT NULL DEFAULT FALSE,

  -- 6. Observations & Thème
  ADD COLUMN IF NOT EXISTS mentoring_theme TEXT,
  ADD COLUMN IF NOT EXISTS other_observations TEXT;

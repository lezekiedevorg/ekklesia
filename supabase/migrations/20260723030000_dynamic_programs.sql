-- ═══════════════════════════════════════════════════════════════
-- Dynamic programs / cultes: move the fixed program_type enum into a
-- configurable `programs` table so the backoffice can CRUD services.
-- attendance.program_type becomes text (keeps all existing data + keys).
-- The sunday streak trigger keeps comparing the well-known 'sunday_service'
-- key, which remains seeded — no trigger change needed.
-- ═══════════════════════════════════════════════════════════════

-- 1. Programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(120) NOT NULL,
    icon VARCHAR(10) DEFAULT '📅',
    day_of_week SMALLINT,            -- 0=dimanche .. 6=samedi (nullable)
    eligibility_class VARCHAR(30),   -- si défini: seuls les membres avec current_class = cette valeur comptent
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed the current 5 programs (preserve keys, labels, icons, class eligibility)
INSERT INTO programs (key, label, icon, day_of_week, eligibility_class, sort_order) VALUES
('sunday_service',  'Dimanche (Culte Dominical)',         '🌞', 0, NULL,              10),
('tuesday_class',   'Mardi (Classe d''affermissement)',   '📘', 2, 'tuesday_class',   20),
('wednesday_class', 'Mercredi (Classe de fondements)',    '📗', 3, 'wednesday_class', 30),
('thursday_online', 'Jeudi (Prière en ligne)',            '🌐', 4, NULL,              40),
('friday_service',  'Vendredi (Veillée / Culte)',         '🔥', 5, NULL,              50)
ON CONFLICT (key) DO NOTHING;

-- 3. Move attendance.program_type from the enum to text (data + unique constraint + index preserved)
ALTER TABLE attendance ALTER COLUMN program_type TYPE VARCHAR(50) USING program_type::text;

-- 4. RLS: everyone reads, pastor/admin/super_admin manage
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_read_all" ON programs
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "programs_pastor_all" ON programs
    FOR ALL USING (is_pastor());

-- 5. Permissions
INSERT INTO app_permissions (code, category, name, description) VALUES
('programs:view', 'Programmes', 'Voir les programmes', 'Consulter la liste des programmes / cultes'),
('programs:edit', 'Programmes', 'Gérer les programmes', 'Créer, modifier, activer ou supprimer des programmes / cultes')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app_role_permissions (role_code, permission_code)
SELECT r.role_code, p.code
FROM (VALUES ('super_admin'), ('admin'), ('pastor')) AS r(role_code)
CROSS JOIN (VALUES ('programs:view'), ('programs:edit')) AS p(code)
ON CONFLICT DO NOTHING;

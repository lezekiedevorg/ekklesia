-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Departments, Newcomer Registration, and Stats Support
-- ═══════════════════════════════════════════════════════════════

-- 1. Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    icon VARCHAR(10) DEFAULT '🏛️',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Member-Department join table (many-to-many)
CREATE TABLE member_departments (
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (member_id, department_id)
);

-- 3. Newcomer registrations table
CREATE TABLE newcomer_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    registered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invited_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    residence_location VARCHAR(255),
    is_self_initiated BOOLEAN DEFAULT false,
    assigned_shepherd_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add residence_location to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS residence_location VARCHAR(255);

-- 5. Seed 6 default departments
INSERT INTO departments (name, description, icon) VALUES
('Jeunesse', 'Ministère de la jeunesse', '🧑‍🤝‍🧑'),
('Musique', 'Louange et worship', '🎵'),
('Ordre', 'Service d''ordre et accueil', '🛡️'),
('Amis des Nouveaux', 'Accueil et intégration des nouveaux venus', '🤝'),
('Prière', 'Intercession et prière', '🙏'),
('Évangélisation', 'Mission et évangélisation', '📣')
ON CONFLICT (name) DO NOTHING;

-- 6. Seed configurable shepherd score weights
INSERT INTO app_settings (key, value, category, description) VALUES
('shepherd_score_weights', '{"attendance": 30, "discipline": 25, "evangelism": 20, "reports": 15, "pastoral_care": 10}'::jsonb, 'scoring', 'Poids des critères du score berger (total = 100)')
ON CONFLICT (key) DO NOTHING;

-- 7. Indexes
CREATE INDEX idx_member_departments_member ON member_departments(member_id);
CREATE INDEX idx_member_departments_dept ON member_departments(department_id);
CREATE INDEX idx_newcomer_reg_date ON newcomer_registrations(registration_date);
CREATE INDEX idx_newcomer_reg_member ON newcomer_registrations(member_id);
CREATE INDEX idx_newcomer_reg_shepherd ON newcomer_registrations(assigned_shepherd_id);

-- 8. RLS policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newcomer_registrations ENABLE ROW LEVEL SECURITY;

-- Departments: everyone can read, pastor/admin/super_admin can manage
CREATE POLICY "departments_read_all" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "departments_pastor_all" ON departments
    FOR ALL USING (is_pastor());

-- Member-departments: everyone can read, pastor/admin/super_admin can manage
CREATE POLICY "member_dept_read_all" ON member_departments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "member_dept_pastor_all" ON member_departments
    FOR ALL USING (is_pastor());
-- Shepherd can manage their own members' department assignments
CREATE POLICY "member_dept_shepherd" ON member_departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = member_departments.member_id
              AND members.shepherd_id = auth.uid()
        )
    );

-- Newcomer registrations: everyone can read, pastor/admin/super_admin can manage
CREATE POLICY "newcomer_read_all" ON newcomer_registrations
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "newcomer_pastor_all" ON newcomer_registrations
    FOR ALL USING (is_pastor());

-- 9. Add new permissions to app_permissions
INSERT INTO app_permissions (code, category, name, description) VALUES
('departments:view', 'Départements', 'Voir les départements', 'Consulter la liste des départements ministériels'),
('departments:edit', 'Départements', 'Modifier les départements', 'Créer, modifier ou supprimer des départements'),
('departments:assign', 'Départements', 'Assigner aux départements', 'Assigner ou retirer des membres d''un département'),
('newcomers:register', 'Nouveaux', 'Enregistrer les nouveaux', 'Enregistrer les nouveaux venus le dimanche'),
('newcomers:view_all', 'Nouveaux', 'Voir tous les nouveaux', 'Consulter l''historique complet des enregistrements'),
('stats:view_global', 'Statistiques', 'Voir les stats globales', 'Consulter le tableau de bord global et les KPIs'),
('stats:compare', 'Statistiques', 'Comparer les entités', 'Comparer bergers, groupes et départements'),
('stats:evolution', 'Statistiques', 'Voir l''évolution', 'Consulter les graphiques d''évolution temporelle'),
('super_dashboard:view', 'Administration', 'Voir le centre de commandement', 'Accéder au tableau de bord super administrateur')
ON CONFLICT (code) DO NOTHING;

-- 10. Assign new permissions to roles
-- Super Admin gets all new permissions
INSERT INTO app_role_permissions (role_code, permission_code)
SELECT 'super_admin', code FROM app_permissions
WHERE code IN ('departments:view', 'departments:edit', 'departments:assign', 'newcomers:register', 'newcomers:view_all', 'stats:view_global', 'stats:compare', 'stats:evolution', 'super_dashboard:view')
ON CONFLICT DO NOTHING;

-- Admin gets all new permissions
INSERT INTO app_role_permissions (role_code, permission_code)
SELECT 'admin', code FROM app_permissions
WHERE code IN ('departments:view', 'departments:edit', 'departments:assign', 'newcomers:register', 'newcomers:view_all', 'stats:view_global', 'stats:compare', 'stats:evolution', 'super_dashboard:view')
ON CONFLICT DO NOTHING;

-- Pastor gets all new permissions
INSERT INTO app_role_permissions (role_code, permission_code)
SELECT 'pastor', code FROM app_permissions
WHERE code IN ('departments:view', 'departments:edit', 'departments:assign', 'newcomers:register', 'newcomers:view_all', 'stats:view_global', 'stats:compare', 'stats:evolution', 'super_dashboard:view')
ON CONFLICT DO NOTHING;

-- Leader gets view and register permissions
INSERT INTO app_role_permissions (role_code, permission_code) VALUES
('leader', 'departments:view'),
('leader', 'newcomers:register'),
('leader', 'newcomers:view_all')
ON CONFLICT DO NOTHING;

-- Shepherd gets view and register permissions
INSERT INTO app_role_permissions (role_code, permission_code) VALUES
('shepherd', 'departments:view'),
('shepherd', 'newcomers:register')
ON CONFLICT DO NOTHING;

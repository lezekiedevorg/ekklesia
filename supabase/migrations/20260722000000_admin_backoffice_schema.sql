-- Add 'admin' and 'super_admin' values to user_role ENUM if they don't exist
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 1. Create app_roles table
CREATE TABLE IF NOT EXISTS app_roles (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create app_permissions table
CREATE TABLE IF NOT EXISTS app_permissions (
    code VARCHAR(100) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 3. Create app_role_permissions join table
CREATE TABLE IF NOT EXISTS app_role_permissions (
    role_code VARCHAR(50) REFERENCES app_roles(code) ON DELETE CASCADE,
    permission_code VARCHAR(100) REFERENCES app_permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role_code, permission_code)
);

-- 4. Create app_user_roles table (supports multiple roles or specific granular role assignment)
CREATE TABLE IF NOT EXISTS app_user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_code VARCHAR(50) REFERENCES app_roles(code) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_code)
);

-- 5. Create app_settings table (dynamic JSONB configurations)
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. Create app_audit_logs table
CREATE TABLE IF NOT EXISTS app_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON app_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON app_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON app_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON app_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_code ON app_role_permissions(role_code);

-- 7. Seed Default Roles
INSERT INTO app_roles (code, name, description, is_system) VALUES
('super_admin', 'Super Administrateur', 'Accès total et contrôle complet du système, sécurité et configurations critiques.', true),
('admin', 'Administrateur', 'Gestion du backoffice, des utilisateurs, paramètres et règles de l''application.', true),
('pastor', 'Pasteur Principal', 'Vision complète des rapports, validation, supervision des bergers et alertes pastorales.', true),
('leader', 'Leader / Chef de Tribu', 'Supervision des bergers et fidèles de son groupe/tribu.', true),
('shepherd', 'Berger / Encadrant', 'Suivi de base des fidèles, pointages d''assiduité, soumission de rapports hebdomadaires.', true)
ON CONFLICT (code) DO NOTHING;

-- 8. Seed Default Permissions
INSERT INTO app_permissions (code, category, name, description) VALUES
-- Administration & Accès Backoffice
('admin:access', 'Administration', 'Accès au Backoffice', 'Permet d''accéder à l''interface d''administration de l''église'),
('users:view', 'Utilisateurs', 'Voir les utilisateurs', 'Consulter la liste des comptes et profils'),
('users:create', 'Utilisateurs', 'Créer un utilisateur', 'Créer un nouveau compte utilisateur depuis le backoffice'),
('users:edit', 'Utilisateurs', 'Modifier un utilisateur', 'Modifier les informations, réinitialiser ou désactiver un compte'),
('users:delete', 'Utilisateurs', 'Supprimer un utilisateur', 'Supprimer définitivement un compte utilisateur'),
('roles:view', 'Rôles & Permissions', 'Voir les rôles', 'Consulter la matrice des rôles et permissions'),
('roles:edit', 'Rôles & Permissions', 'Modifier les permissions', 'Assigner ou modifier les permissions accordées à un rôle'),
('settings:view', 'Paramètres', 'Voir les paramètres', 'Consulter les règles et seuils de l''application'),
('settings:edit', 'Paramètres', 'Modifier les paramètres', 'Modifier les règles (assiduité, disciplines spirituelles, etc.)'),
('master_data:edit', 'Référentiels', 'Gérer les données maîtresses', 'Ajouter ou modifier des programmes, classes, groupes'),
('logs:view', 'Audit', 'Consulter les journaux d''audit', 'Voir l''historique des connexions, modifications et alertes de sécurité'),
-- Opérations Métier & Pastorales
('reports:view_all', 'Rapports', 'Voir tous les rapports', 'Consulter les rapports hebdomadaires de tous les bergers'),
('reports:validate', 'Rapports', 'Valider/Rejeter les rapports', 'Donner l''approbation ou rejeter un rapport soumis'),
('members:view_all', 'Fidèles', 'Voir tous les fidèles', 'Consulter l''ensemble des membres de l''église'),
('members:create', 'Fidèles', 'Ajouter un fidèle', 'Enregistrer un nouveau membre ou contact dans le système'),
('members:edit', 'Fidèles', 'Modifier un fidèle', 'Mettre à jour les informations ou statut d''un fidèle')
ON CONFLICT (code) DO NOTHING;

-- 9. Assign Permissions to Roles
-- Super Admin & Admin get all permissions
INSERT INTO app_role_permissions (role_code, permission_code)
SELECT 'super_admin', code FROM app_permissions
ON CONFLICT DO NOTHING;

INSERT INTO app_role_permissions (role_code, permission_code)
SELECT 'admin', code FROM app_permissions
ON CONFLICT DO NOTHING;

-- Pastor permissions
INSERT INTO app_role_permissions (role_code, permission_code) VALUES
('pastor', 'reports:view_all'),
('pastor', 'reports:validate'),
('pastor', 'members:view_all'),
('pastor', 'members:create'),
('pastor', 'members:edit')
ON CONFLICT DO NOTHING;

-- Leader permissions
INSERT INTO app_role_permissions (role_code, permission_code) VALUES
('leader', 'reports:view_all'),
('leader', 'members:view_all'),
('leader', 'members:create'),
('leader', 'members:edit')
ON CONFLICT DO NOTHING;

-- Shepherd permissions
INSERT INTO app_role_permissions (role_code, permission_code) VALUES
('shepherd', 'members:create'),
('shepherd', 'members:edit')
ON CONFLICT DO NOTHING;

-- 10. Seed Default Settings
INSERT INTO app_settings (key, value, category, description) VALUES
('attendance_alert_threshold_pct', '70'::jsonb, 'attendance', 'Seuil d''assiduité en pourcentage en dessous duquel une alerte pastorale est déclenchée'),
('consecutive_absences_alert', '2'::jsonb, 'attendance', 'Nombre de dimanches consécutifs d''absence déclenchant une alerte de relance'),
('daily_disciplines_list', '["daily_prayer_done", "daily_meditation_done", "meditated_book"]'::jsonb, 'disciplines', 'Liste des disciplines spirituelles quotidiennes à pointer'),
('intermittent_disciplines_list', '["evangelization_done", "monthly_prayer_vigil_done", "monthly_in_person_prayer_done"]'::jsonb, 'disciplines', 'Liste des disciplines spirituelles intermittentes ou mensuelles'),
('church_name', '"Église de Sagesse et Puissance"'::jsonb, 'church_info', 'Nom officiel de l''église affiché dans l''application et les rapports'),
('senior_pastor', '"Pasteur Principal"'::jsonb, 'church_info', 'Nom ou titre du pasteur principal pour la signature des rapports')
ON CONFLICT (key) DO NOTHING;

-- 11. Helper functions for RLS and Backend Queries
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (permission_code VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT arp.permission_code
    FROM app_user_roles aur
    JOIN app_role_permissions arp ON aur.role_code = arp.role_code
    WHERE aur.user_id = p_user_id
    UNION
    -- Fallback: Check profiles.role if app_user_roles not populated yet
    SELECT DISTINCT arp.permission_code
    FROM profiles p
    JOIN app_role_permissions arp ON p.role::text = arp.role_code
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM get_user_permissions(p_user_id)
    WHERE permission_code = p_permission_code;
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Trigger to keep profiles.role aligned with primary role or when profile is created
CREATE OR REPLACE FUNCTION sync_profile_role_to_app_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO app_user_roles (user_id, role_code)
    VALUES (NEW.id, NEW.role::text)
    ON CONFLICT (user_id, role_code) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON profiles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OF role ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_profile_role_to_app_user_roles();

-- Backfill app_user_roles from existing profiles
INSERT INTO app_user_roles (user_id, role_code)
SELECT id, role::text FROM profiles
ON CONFLICT (user_id, role_code) DO NOTHING;

-- 13. Enable RLS on all new tables
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone authenticated can read roles, permissions, settings
CREATE POLICY "Authenticated users can read app_roles" ON app_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read app_permissions" ON app_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read app_role_permissions" ON app_role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read app_user_roles" ON app_user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read app_settings" ON app_settings FOR SELECT TO authenticated USING (true);

-- Admins can modify settings, roles, permissions
CREATE POLICY "Admins can update app_settings" ON app_settings FOR ALL TO authenticated
USING (has_permission(auth.uid(), 'settings:edit'))
WITH CHECK (has_permission(auth.uid(), 'settings:edit'));

CREATE POLICY "Admins can update app_role_permissions" ON app_role_permissions FOR ALL TO authenticated
USING (has_permission(auth.uid(), 'roles:edit'))
WITH CHECK (has_permission(auth.uid(), 'roles:edit'));

CREATE POLICY "Admins can update app_user_roles" ON app_user_roles FOR ALL TO authenticated
USING (has_permission(auth.uid(), 'users:edit'))
WITH CHECK (has_permission(auth.uid(), 'users:edit'));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON app_audit_logs FOR SELECT TO authenticated
USING (has_permission(auth.uid(), 'logs:view'));

CREATE POLICY "System and authenticated users can insert audit logs" ON app_audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

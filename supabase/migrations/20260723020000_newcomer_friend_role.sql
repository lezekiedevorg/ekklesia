-- ═══════════════════════════════════════════════════════════════
-- Role "Ami des Nouveaux" (newcomer_friend): a real login role with a
-- dedicated app interface, focused on welcoming/integrating newcomers.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add the role to the user_role enum (irreversible; committed before use).
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'newcomer_friend';

-- 2. Register it in app_roles so it appears in the RBAC matrix / user assignment.
INSERT INTO app_roles (code, name, description, is_system) VALUES
('newcomer_friend', 'Ami des Nouveaux', 'Accueil et intégration des nouveaux venus — interface application dédiée.', true)
ON CONFLICT (code) DO NOTHING;

-- 3. Permissions: they welcome newcomers and manage those member records.
INSERT INTO app_role_permissions (role_code, permission_code)
SELECT 'newcomer_friend', code FROM app_permissions
WHERE code IN ('newcomers:register', 'newcomers:view_all', 'members:view_all', 'members:create', 'members:edit')
ON CONFLICT DO NOTHING;

-- 4. RLS helper: true when the current user is an Ami des Nouveaux.
CREATE OR REPLACE FUNCTION is_newcomer_friend()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'newcomer_friend'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Policies — scope: ALL newcomers of the church (church-wide welcome team).
CREATE POLICY "members_newcomer_friend" ON members
    FOR ALL USING (is_newcomer_friend());

CREATE POLICY "attendance_newcomer_friend" ON attendance
    FOR ALL USING (is_newcomer_friend());

CREATE POLICY "newcomer_reg_friend" ON newcomer_registrations
    FOR ALL USING (is_newcomer_friend());

-- They must read profiles (shepherd names) and groups for context.
CREATE POLICY "profiles_newcomer_friend_read" ON profiles
    FOR SELECT USING (is_newcomer_friend());

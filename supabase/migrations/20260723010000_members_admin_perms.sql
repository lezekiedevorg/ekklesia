-- Members CRUD from the backoffice: add a delete permission and make sure
-- admin / super_admin can fully manage members (the seed only gave these to
-- pastor / leader / shepherd).

INSERT INTO app_permissions (code, category, name, description) VALUES
('members:delete', 'Fidèles', 'Supprimer un fidèle', 'Supprimer définitivement un fidèle du système')
ON CONFLICT (code) DO NOTHING;

-- Grant the full members permission set to admin and super_admin
INSERT INTO app_role_permissions (role_code, permission_code)
SELECT r.role_code, p.code
FROM (VALUES ('admin'), ('super_admin')) AS r(role_code)
CROSS JOIN (VALUES ('members:view_all'), ('members:create'), ('members:edit'), ('members:delete')) AS p(code)
ON CONFLICT DO NOTHING;

-- Pastor may also delete
INSERT INTO app_role_permissions (role_code, permission_code) VALUES
('pastor', 'members:delete')
ON CONFLICT DO NOTHING;

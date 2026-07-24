-- Les rôles admin / super_admin n'étaient couverts par aucune policy RLS :
-- is_pastor() ne matchait que 'pastor', donc un super_admin ne voyait que les
-- fidèles dont il est personnellement le berger (dashboard à 0).
-- On élargit la fonction plutôt que de dupliquer une policy par table :
-- toutes les policies "*_pastor_all" en héritent.

CREATE OR REPLACE FUNCTION is_pastor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('pastor', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

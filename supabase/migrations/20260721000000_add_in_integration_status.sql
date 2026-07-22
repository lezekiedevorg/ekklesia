-- Migration : Ajout de la valeur in_integration dans l'enum member_status
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'in_integration';

-- Ajout politique UPDATE pour que les leaders puissent modifier les membres de leur groupe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'members' AND policyname = 'members_leader_update'
    ) THEN
        CREATE POLICY "members_leader_update" ON members
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = members.shepherd_id
                      AND profiles.group_id = get_user_group_id()
                )
            );
        RAISE NOTICE 'Policy members_leader_update created successfully.';
    END IF;
END
$$;

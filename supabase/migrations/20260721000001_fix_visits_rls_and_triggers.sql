-- Migration: 20260721000001_fix_visits_rls_and_triggers.sql
-- Description: Make attendance and pastoral visit trigger functions SECURITY DEFINER so table updates are never blocked by RLS, and fix member_visits RLS policies to allow Leaders and Shepherds to insert, read, and update cleanly.

-- 1. Make handle_pastoral_visit_logged SECURITY DEFINER so updating members always succeeds
CREATE OR REPLACE FUNCTION handle_pastoral_visit_logged()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members
    SET consecutive_absences = 0,
        last_seen_date = NEW.visit_date
    WHERE id = NEW.member_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make handle_sunday_attendance_update SECURITY DEFINER so updating members always succeeds
CREATE OR REPLACE FUNCTION handle_sunday_attendance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_consecutive_absences INT;
    v_consecutive_sundays INT;
    v_status TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.is_present = OLD.is_present THEN
        RETURN NEW;
    END IF;

    SELECT consecutive_absences, consecutive_sundays_present, status
    INTO v_consecutive_absences, v_consecutive_sundays, v_status
    FROM members
    WHERE id = NEW.member_id;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_present = TRUE AND NEW.is_present = FALSE THEN
            v_consecutive_sundays := GREATEST(0, COALESCE(v_consecutive_sundays, 0) - 1);
            v_consecutive_absences := COALESCE(v_consecutive_absences, 0) + 1;
        ELSIF OLD.is_present = FALSE AND NEW.is_present = TRUE THEN
            v_consecutive_absences := GREATEST(0, COALESCE(v_consecutive_absences, 0) - 1);
            v_consecutive_sundays := COALESCE(v_consecutive_sundays, 0) + 1;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.is_present = TRUE THEN
            v_consecutive_absences := 0;
            v_consecutive_sundays := COALESCE(v_consecutive_sundays, 0) + 1;
            IF NEW.date > COALESCE((SELECT last_seen_date FROM members WHERE id = NEW.member_id), '1970-01-01'::date) THEN
                UPDATE members SET last_seen_date = NEW.date WHERE id = NEW.member_id;
            END IF;
        ELSE
            v_consecutive_absences := COALESCE(v_consecutive_absences, 0) + 1;
            v_consecutive_sundays := 0;
        END IF;
    END IF;

    IF v_consecutive_absences >= 2 THEN
        v_status := 'absent_to_relaunch';
    ELSIF v_status = 'absent_to_relaunch' AND v_consecutive_sundays >= 4 THEN
        v_status := 'member';
    END IF;

    UPDATE members
    SET consecutive_absences = v_consecutive_absences,
        consecutive_sundays_present = v_consecutive_sundays,
        status = v_status
    WHERE id = NEW.member_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix RLS policies on member_visits so Shepherds and Leaders can insert, read, and update visits
DROP POLICY IF EXISTS "visits_shepherd_all" ON member_visits;
CREATE POLICY "visits_shepherd_all" ON member_visits
    FOR ALL USING (shepherd_id = auth.uid())
    WITH CHECK (shepherd_id = auth.uid());

DROP POLICY IF EXISTS "visits_leader_read" ON member_visits;
DROP POLICY IF EXISTS "visits_leader_all" ON member_visits;
CREATE POLICY "visits_leader_all" ON member_visits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = member_visits.shepherd_id
              AND profiles.group_id = get_user_group_id()
        ) OR EXISTS (
            SELECT 1 FROM members
            JOIN profiles ON profiles.id = members.shepherd_id
            WHERE members.id = member_visits.member_id
              AND profiles.group_id = get_user_group_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = member_visits.shepherd_id
              AND profiles.group_id = get_user_group_id()
        ) OR EXISTS (
            SELECT 1 FROM members
            JOIN profiles ON profiles.id = members.shepherd_id
            WHERE members.id = member_visits.member_id
              AND profiles.group_id = get_user_group_id()
        )
    );

DROP POLICY IF EXISTS "visits_pastor_all" ON member_visits;
CREATE POLICY "visits_pastor_all" ON member_visits
    FOR ALL USING (is_pastor())
    WITH CHECK (is_pastor());

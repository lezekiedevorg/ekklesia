-- Fix: newcomers (status='new') stay 'new' when absent on Sunday
-- They no longer transition to 'absent_to_relaunch' after a single absence.
-- Only consecutive_absences is incremented. Graduation to 'member' at 4 presences is preserved.
CREATE OR REPLACE FUNCTION handle_sunday_attendance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_status member_status;
    v_consecutive_sundays INTEGER;
    v_consecutive_abs INTEGER;
BEGIN
    -- Only trigger on sunday_service attendance changes
    IF NEW.program_type = 'sunday_service' THEN
        -- If update and no change in is_present, do nothing
        IF TG_OP = 'UPDATE' AND NEW.is_present = OLD.is_present THEN
            RETURN NEW;
        END IF;

        SELECT status, consecutive_sundays_present, consecutive_absences
        INTO v_status, v_consecutive_sundays, v_consecutive_abs
        FROM members WHERE id = NEW.member_id;

        IF NEW.is_present = TRUE THEN
            -- Member was present (or changed from absent to present)
            v_consecutive_abs := 0;
            v_consecutive_sundays := v_consecutive_sundays + 1;

            -- If new and reached 4 presences, graduate to member
            IF v_status = 'new' AND v_consecutive_sundays >= 4 THEN
                v_status := 'member';
            -- If was absent_to_relaunch and now reached 4 presences, graduate to member
            ELSIF v_status = 'absent_to_relaunch' AND v_consecutive_sundays >= 4 THEN
                v_status := 'member';
            -- If was absent_to_relaunch and < 4, return to new status
            ELSIF v_status = 'absent_to_relaunch' AND v_consecutive_sundays < 4 THEN
                v_status := 'new';
            END IF;

            UPDATE members SET
                consecutive_sundays_present = v_consecutive_sundays,
                consecutive_absences = v_consecutive_abs,
                status = v_status,
                last_seen_date = NEW.date
            WHERE id = NEW.member_id;

        ELSE
            -- Member was absent on Sunday (or changed from present to absent)
            IF TG_OP = 'UPDATE' AND OLD.is_present = TRUE THEN
                v_consecutive_sundays := GREATEST(0, v_consecutive_sundays - 1);
            END IF;

            v_consecutive_abs := v_consecutive_abs + 1;

            -- NEW BEHAVIOR: newcomers stay 'new' when absent
            -- Only non-new members with < 4 presences go to absent_to_relaunch
            IF v_status != 'new' AND v_status != 'member' AND v_status != 'absent_to_relaunch' THEN
                -- Unknown status fallback (should not happen)
                v_status := 'absent_to_relaunch';
            END IF;
            -- Note: 'new' stays 'new', 'member' stays 'member',
            -- 'absent_to_relaunch' stays 'absent_to_relaunch'

            UPDATE members SET
                consecutive_sundays_present = v_consecutive_sundays,
                consecutive_absences = v_consecutive_abs,
                status = v_status
            WHERE id = NEW.member_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

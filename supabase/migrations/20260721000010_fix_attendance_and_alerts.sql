-- Fix function handle_sunday_attendance_update to handle UPDATE without changing presence correctly
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
            
            -- If new and < 4, suspend to absent_to_relaunch without resetting consecutive_sundays_present
            IF v_status = 'new' AND v_consecutive_sundays < 4 THEN
                v_status := 'absent_to_relaunch';
            END IF;

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

-- Clean up invalid data where both consecutive_absences > 0 and consecutive_sundays_present > 0 simultaneously from previous double updates
UPDATE members
SET consecutive_sundays_present = 0
WHERE consecutive_absences > 0 AND consecutive_sundays_present > 0;

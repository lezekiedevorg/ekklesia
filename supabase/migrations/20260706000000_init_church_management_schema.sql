-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('pastor', 'leader', 'shepherd');
CREATE TYPE group_name AS ENUM ('Puissance', 'Gloire', 'Sagesse');
CREATE TYPE member_status AS ENUM ('new', 'member', 'absent_to_relaunch');
CREATE TYPE class_status AS ENUM ('none', 'tuesday_class', 'wednesday_class', 'completed');
CREATE TYPE program_type AS ENUM ('tuesday_class', 'wednesday_class', 'thursday_online', 'friday_service', 'sunday_service');
CREATE TYPE report_status AS ENUM ('submitted', 'approved');

-- 2. Create Groups Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name group_name NOT NULL UNIQUE,
    leader_id UUID, -- Will reference profiles(id)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Profiles Table (Users: Pastor, Leaders, Shepherds)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'shepherd',
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for groups.leader_id -> profiles.id
ALTER TABLE groups ADD CONSTRAINT fk_groups_leader FOREIGN KEY (leader_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Create Members Table (Fidèles / Âmes)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    shepherd_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invited_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    status member_status NOT NULL DEFAULT 'new',
    current_class class_status NOT NULL DEFAULT 'none',
    consecutive_sundays_present INTEGER NOT NULL DEFAULT 1,
    consecutive_absences INTEGER NOT NULL DEFAULT 0,
    last_seen_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Attendance Table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    program_type program_type NOT NULL,
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_member_date_program UNIQUE (member_id, date, program_type)
);

-- 6. Create Shepherd Activities Table
CREATE TABLE shepherd_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shepherd_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    daily_meditations_count INTEGER NOT NULL DEFAULT 0 CHECK (daily_meditations_count BETWEEN 0 AND 7),
    daily_prayers_hours_count INTEGER NOT NULL DEFAULT 0 CHECK (daily_prayers_hours_count BETWEEN 0 AND 7),
    evangelization_done BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_prayer_vigil_done BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_in_person_prayer_done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_shepherd_week UNIQUE (shepherd_id, week_start_date)
);

-- 7. Create Member Visits Table
CREATE TABLE member_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shepherd_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    accompanied_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Sunday Absences Table
CREATE TABLE sunday_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_member_sunday_absence UNIQUE (member_id, date)
);

-- 9. Create Weekly Reports Table
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shepherd_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_end_date DATE NOT NULL,
    status report_status NOT NULL DEFAULT 'submitted',
    report_data JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    CONSTRAINT uq_shepherd_report_date UNIQUE (shepherd_id, week_end_date)
);

-- 10. Indexes for fast query performance
CREATE INDEX idx_profiles_group_id ON profiles(group_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_members_shepherd_id ON members(shepherd_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_current_class ON members(current_class);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, date);
CREATE INDEX idx_attendance_program_type ON attendance(program_type);
CREATE INDEX idx_member_visits_shepherd_member ON member_visits(shepherd_id, member_id);
CREATE INDEX idx_weekly_reports_shepherd_date ON weekly_reports(shepherd_id, week_end_date);

-- 11. Trigger function for automatic member integration and absence alert tracking
CREATE OR REPLACE FUNCTION handle_sunday_attendance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_status member_status;
    v_consecutive_sundays INTEGER;
    v_consecutive_abs INTEGER;
BEGIN
    -- Only trigger on sunday_service attendance changes
    IF NEW.program_type = 'sunday_service' THEN
        SELECT status, consecutive_sundays_present, consecutive_absences
        INTO v_status, v_consecutive_sundays, v_consecutive_abs
        FROM members WHERE id = NEW.member_id;

        IF NEW.is_present = TRUE THEN
            -- Member was present
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
            -- Member was absent on Sunday
            v_consecutive_abs := v_consecutive_abs + 1;
            
            -- If new and < 4, suspend to absent_to_relaunch without resetting consecutive_sundays_present
            IF v_status = 'new' AND v_consecutive_sundays < 4 THEN
                v_status := 'absent_to_relaunch';
            END IF;

            UPDATE members SET
                consecutive_absences = v_consecutive_abs,
                status = v_status
            WHERE id = NEW.member_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sunday_attendance
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION handle_sunday_attendance_update();

-- 12. Trigger function to reset consecutive_absences when a pastoral visit is logged
CREATE OR REPLACE FUNCTION handle_pastoral_visit_logged()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members
    SET consecutive_absences = 0,
        status = CASE WHEN status = 'absent_to_relaunch' THEN 'member' ELSE status END,
        last_seen_date = NEW.visit_date
    WHERE id = NEW.member_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pastoral_visit
AFTER INSERT ON member_visits
FOR EACH ROW
EXECUTE FUNCTION handle_pastoral_visit_logged();

-- 13. Insert initial church groups (Puissance, Gloire, Sagesse)
INSERT INTO groups (name) VALUES 
('Puissance'),
('Gloire'),
('Sagesse')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE shepherd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sunday_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check if auth user is pastor
CREATE OR REPLACE FUNCTION is_pastor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'pastor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if auth user is leader of a group
CREATE OR REPLACE FUNCTION get_user_group_id()
RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
BEGIN
    SELECT group_id INTO v_group_id FROM profiles WHERE id = auth.uid();
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Policies for `groups`
CREATE POLICY "groups_read_all" ON groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "groups_pastor_all" ON groups
    FOR ALL USING (is_pastor());

-- 2. Policies for `profiles`
CREATE POLICY "profiles_read_all_authenticated" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_self" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_pastor_all" ON profiles
    FOR ALL USING (is_pastor());

-- 3. Policies for `members`
CREATE POLICY "members_shepherd_all" ON members
    FOR ALL USING (shepherd_id = auth.uid());

CREATE POLICY "members_leader_read" ON members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = members.shepherd_id
              AND profiles.group_id = get_user_group_id()
        )
    );

CREATE POLICY "members_pastor_all" ON members
    FOR ALL USING (is_pastor());

-- 4. Policies for `attendance`
CREATE POLICY "attendance_shepherd_all" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = attendance.member_id
              AND members.shepherd_id = auth.uid()
        )
    );

CREATE POLICY "attendance_leader_read" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            JOIN profiles ON profiles.id = members.shepherd_id
            WHERE members.id = attendance.member_id
              AND profiles.group_id = get_user_group_id()
        )
    );

CREATE POLICY "attendance_pastor_all" ON attendance
    FOR ALL USING (is_pastor());

-- 5. Policies for `shepherd_activities`
CREATE POLICY "activities_shepherd_all" ON shepherd_activities
    FOR ALL USING (shepherd_id = auth.uid());

CREATE POLICY "activities_leader_read" ON shepherd_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = shepherd_activities.shepherd_id
              AND profiles.group_id = get_user_group_id()
        )
    );

CREATE POLICY "activities_pastor_all" ON shepherd_activities
    FOR ALL USING (is_pastor());

-- 6. Policies for `member_visits`
CREATE POLICY "visits_shepherd_all" ON member_visits
    FOR ALL USING (shepherd_id = auth.uid());

CREATE POLICY "visits_leader_read" ON member_visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = member_visits.shepherd_id
              AND profiles.group_id = get_user_group_id()
        )
    );

CREATE POLICY "visits_pastor_all" ON member_visits
    FOR ALL USING (is_pastor());

-- 7. Policies for `sunday_absences`
CREATE POLICY "absences_shepherd_all" ON sunday_absences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = sunday_absences.member_id
              AND members.shepherd_id = auth.uid()
        )
    );

CREATE POLICY "absences_leader_read" ON sunday_absences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            JOIN profiles ON profiles.id = members.shepherd_id
            WHERE members.id = sunday_absences.member_id
              AND profiles.group_id = get_user_group_id()
        )
    );

CREATE POLICY "absences_pastor_all" ON sunday_absences
    FOR ALL USING (is_pastor());

-- 8. Policies for `weekly_reports`
CREATE POLICY "reports_shepherd_all" ON weekly_reports
    FOR ALL USING (shepherd_id = auth.uid());

CREATE POLICY "reports_leader_read_update" ON weekly_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = weekly_reports.shepherd_id
              AND profiles.group_id = get_user_group_id()
        )
    );

CREATE POLICY "reports_pastor_all" ON weekly_reports
    FOR ALL USING (is_pastor());

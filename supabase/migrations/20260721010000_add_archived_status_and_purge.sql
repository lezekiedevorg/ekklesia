-- Migration: Add 'archived' status, archived_at column, and purge function for 3-month purgatory

-- 1. Add 'archived' value to member_status enum
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'archived';

-- 2. Update status check constraint on members table
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check 
  CHECK (status IN ('new', 'in_integration', 'member', 'absent_to_relaunch', 'archived'));

-- 3. Add archived_at column
ALTER TABLE members ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Create automatic/manual purge function for expired archived members (90 days)
CREATE OR REPLACE FUNCTION purge_expired_archived_members()
RETURNS void AS $$
BEGIN
  DELETE FROM members
  WHERE status = 'archived'
  AND archived_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

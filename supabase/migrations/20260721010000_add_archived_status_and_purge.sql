-- Migration: Add 'archived' status, archived_at column, and purge function for 3-month purgatory

-- 1. Add 'archived' value to member_status enum (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'archived' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'member_status')) THEN
    ALTER TYPE member_status ADD VALUE 'archived';
  END IF;
END $$;

-- 2. Update status check constraint on members table (safer approach)
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_status_check') THEN
    ALTER TABLE members DROP CONSTRAINT members_status_check;
  END IF;
  
  -- Add new constraint with all statuses including archived
  ALTER TABLE members ADD CONSTRAINT members_status_check 
    CHECK (status IN ('new', 'in_integration', 'member', 'absent_to_relaunch', 'archived'));
EXCEPTION WHEN OTHERS THEN
  -- If constraint creation fails (e.g., existing data doesn't match), skip it
  RAISE NOTICE 'Could not create members_status_check constraint: %', SQLERRM;
END $$;

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

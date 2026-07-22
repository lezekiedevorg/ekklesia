-- Migration: update shepherd_activities for boolean daily tracking and book meditated
ALTER TABLE shepherd_activities 
  ADD COLUMN IF NOT EXISTS daily_prayer_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_meditation_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meditated_book TEXT;

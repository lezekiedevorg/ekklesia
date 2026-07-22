-- Fix weekly_reports NOT NULL constraints on duplicate columns
ALTER TABLE weekly_reports ALTER COLUMN week_end_date DROP NOT NULL;
ALTER TABLE weekly_reports ALTER COLUMN report_data DROP NOT NULL;

-- Create sync trigger for weekly_reports
CREATE OR REPLACE FUNCTION sync_weekly_reports_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.week_end_date IS NULL THEN NEW.week_end_date := NEW.report_date; END IF;
  IF NEW.report_date IS NULL THEN NEW.report_date := NEW.week_end_date; END IF;
  IF NEW.report_data IS NULL THEN NEW.report_data := NEW.content; END IF;
  IF NEW.content IS NULL THEN NEW.content := NEW.report_data; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_weekly_reports_columns ON weekly_reports;
CREATE TRIGGER trg_sync_weekly_reports_columns
BEFORE INSERT OR UPDATE ON weekly_reports
FOR EACH ROW
EXECUTE FUNCTION sync_weekly_reports_columns();

-- Fix shepherd_activities NOT NULL constraints on counts
ALTER TABLE shepherd_activities ALTER COLUMN daily_meditations_count DROP NOT NULL;
ALTER TABLE shepherd_activities ALTER COLUMN daily_meditations_count SET DEFAULT 0;
ALTER TABLE shepherd_activities ALTER COLUMN daily_prayers_hours_count DROP NOT NULL;
ALTER TABLE shepherd_activities ALTER COLUMN daily_prayers_hours_count SET DEFAULT 0;

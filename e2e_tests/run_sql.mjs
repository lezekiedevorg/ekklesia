import postgres from 'postgres';

const sql = postgres('postgresql://postgres.lzfnmjojlymmnkhlpcda:JdTzHPoZ693hR1kW@aws-0-eu-west-1.pooler.supabase.com:6543/postgres', {
  ssl: 'require'
});

async function main() {
  try {
    console.log("Checking columns of weekly_reports...");
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weekly_reports';
    `;
    console.log("Existing columns:", cols);

    console.log("Adding report_date, content, group_id columns to weekly_reports if not exist...");
    await sql`ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS report_date DATE;`;
    await sql`ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS content JSONB;`;
    await sql`ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;`;

    // Add unique constraint for (shepherd_id, report_date)
    console.log("Adding unique constraint uq_shepherd_report_date_v2 if not exists...");
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_shepherd_report_date_v2'
        ) THEN
          ALTER TABLE weekly_reports ADD CONSTRAINT uq_shepherd_report_date_v2 UNIQUE (shepherd_id, report_date);
        END IF;
      END
      $$;
    `;

    // Ensure index on group_id
    await sql`CREATE INDEX IF NOT EXISTS idx_weekly_reports_group_id ON weekly_reports(group_id);`;

    console.log("Done updating weekly_reports schema!");
    const colsAfter = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weekly_reports';
    `;
    console.log("Updated columns:", colsAfter);
  } catch (err) {
    console.error("SQL Error:", err);
  } finally {
    await sql.end();
  }
}

main();

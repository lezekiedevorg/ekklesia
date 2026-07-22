import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lzfnmjojlymmnkhlpcda.supabase.co',
  'sb_publishable_kGAXITYgs5K8uX3ARcZCZQ_y4pmvD_C'
);

async function check() {
  const { data, error } = await supabase.from('weekly_reports').select('id, shepherd_id, week_end_date, report_date, report_data, content, group_id').limit(1);
  console.log("Cols check:", error);
}

check();

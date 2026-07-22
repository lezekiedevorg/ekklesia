import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lzfnmjojlymmnkhlpcda.supabase.co',
  'sb_publishable_kGAXITYgs5K8uX3ARcZCZQ_y4pmvD_C'
);

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'ezekiel@eglise.org',
    password: 'azerty'
  });

  const { data: rep, error: rErr } = await supabase
    .from('weekly_reports')
    .select('*, profiles(first_name, last_name, groups!profiles_group_id_fkey(name))')
    .limit(1);
  console.log("Weekly reports select check:", rep, rErr);
}

check();

import { createClient } from '../src/lib/supabase/server';

async function test() {
  console.log("Testing signInWithPassword via createClient() from server.ts...");
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'ezekiel@eglise.org',
      password: 'azerty'
    });
    if (error) {
      console.error("Login returned error:", error);
    } else {
      console.log("Login SUCCESS! User ID:", data.user?.id, "Email:", data.user?.email);
    }
  } catch (err) {
    console.error("Exception during signInWithPassword:", err);
  }
}

test();

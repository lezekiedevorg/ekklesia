import { customServerFetch } from '../src/lib/supabase/custom-fetch.ts';

async function test() {
  console.log("Testing customServerFetch to Supabase health endpoint...");
  try {
    const res = await customServerFetch('https://lzfnmjojlymmnkhlpcda.supabase.co/auth/v1/health');
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();

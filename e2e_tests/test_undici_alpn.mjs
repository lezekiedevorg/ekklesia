import { setGlobalDispatcher, Agent } from 'undici';
import { createClient } from '@supabase/supabase-js';

setGlobalDispatcher(new Agent({
  connect: {
    alpnProtocols: ['http/1.1'],
    timeout: 10000
  }
}));

const supabase = createClient(
  'https://lzfnmjojlymmnkhlpcda.supabase.co',
  'sb_publishable_kGAXITYgs5K8uX3ARcZCZQ_y4pmvD_C'
);

async function test() {
  console.log("Testing auth login with native undici Agent (alpnProtocols: http/1.1)...");
  const start = Date.now();
  const res = await supabase.auth.signInWithPassword({
    email: 'ezekiel@eglise.org',
    password: 'azerty'
  });
  console.log("Result after", Date.now() - start, "ms:", res);
}

test();

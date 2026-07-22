import fetch from 'node-fetch';
import https from 'node:https';
import { createClient } from '@supabase/supabase-js';

const httpsAgent = new https.Agent({
  alpnProtocols: ['http/1.1'],
  keepAlive: true
});

const customFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    agent: (_parsedURL) => _parsedURL.protocol === 'https:' ? httpsAgent : null
  });
};

const supabase = createClient(
  'https://lzfnmjojlymmnkhlpcda.supabase.co',
  'sb_publishable_kGAXITYgs5K8uX3ARcZCZQ_y4pmvD_C',
  {
    global: {
      fetch: customFetch
    }
  }
);

async function test() {
  console.log("Testing auth login with HTTP/1.1 ALPN agent...");
  const start = Date.now();
  const res = await supabase.auth.signInWithPassword({
    email: 'ezekiel@eglise.org',
    password: 'azerty'
  });
  console.log("Result after", Date.now() - start, "ms:", res);
}

test();

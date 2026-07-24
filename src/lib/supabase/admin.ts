import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for administrative tasks (like creating users)
// This must only be used in Server Actions / Server Components
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Must be the service_role key — the anon key cannot call admin endpoints
  // (auth.admin.createUser etc. return "This endpoint requires a valid Bearer token").
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Clé service_role manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (Supabase → Settings → API → service_role) puis redémarrez le serveur."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Seed test users for E2E testing.
 * Run: node scripts/seed-test-users.mjs
 *
 * Creates auth users + profiles + role assignments in Supabase.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local manually (no dotenv dependency)
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Test accounts ──────────────────────────────────────────────
const USERS = [
  {
    email: 'berger@ekklesia.test',
    password: 'Eglise2026!',
    first_name: 'Marc',
    last_name: 'Kouadio',
    phone: '+22507010001',
    role: 'shepherd',
    group_name: 'Gloire',
  },
  {
    email: 'leader@ekklesia.test',
    password: 'Eglise2026!',
    first_name: 'Jean',
    last_name: 'Bamba',
    phone: '+22507010002',
    role: 'leader',
    group_name: 'Gloire',
  },
  {
    email: 'pastor@ekklesia.test',
    password: 'Eglise2026!',
    first_name: 'Pasteur',
    last_name: 'Kouassi',
    phone: '+22507010003',
    role: 'pastor',
    group_name: null,
  },
  {
    email: 'admin@ekklesia.test',
    password: 'Eglise2026!',
    first_name: 'Admin',
    last_name: 'Backoffice',
    phone: '+22507010004',
    role: 'admin',
    group_name: null,
  },
  {
    email: 'newcomer@ekklesia.test',
    password: 'Eglise2026!',
    first_name: 'Nouveau',
    last_name: 'Accueil',
    phone: '+22507010005',
    role: 'newcomer_friend',
    group_name: null,
  },
];

async function main() {
  console.log('🔧 Seeding test users in Supabase...\n');

  // 1. Ensure groups exist
  const groupNames = [...new Set(USERS.filter((u) => u.group_name).map((u) => u.group_name))];
  const groupIdMap = {};

  for (const gName of groupNames) {
    const { data: existing } = await supabase.from('groups').select('id').eq('name', gName).single();
    if (existing) {
      groupIdMap[gName] = existing.id;
      console.log(`  ✓ Group "${gName}" already exists (${existing.id})`);
    } else {
      const { data: created, error } = await supabase.from('groups').insert({ name: gName }).select('id').single();
      if (error) {
        console.error(`  ✗ Failed to create group "${gName}":`, error.message);
        continue;
      }
      groupIdMap[gName] = created.id;
      console.log(`  ✓ Created group "${gName}" (${created.id})`);
    }
  }

  // 2. Create auth users + profiles
  for (const u of USERS) {
    // Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu) => eu.email === u.email);

    let userId;
    if (existing) {
      userId = existing.id;
      console.log(`  ✓ Auth user "${u.email}" already exists (${userId})`);
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      if (error) {
        console.error(`  ✗ Failed to create auth user "${u.email}":`, error.message);
        continue;
      }
      userId = created.user.id;
      console.log(`  ✓ Created auth user "${u.email}" (${userId})`);
    }

    // 3. Upsert profile
    const profileData = {
      id: userId,
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone,
      role: u.role,
      group_id: u.group_name ? groupIdMap[u.group_name] : null,
    };

    const { error: profileErr } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
    if (profileErr) {
      console.error(`  ✗ Profile upsert failed for "${u.email}":`, profileErr.message);
    } else {
      console.log(`  ✓ Profile upserted for "${u.email}" (role=${u.role})`);
    }

    // 4. Assign role in app_user_roles
    const { error: roleErr } = await supabase.from('app_user_roles').upsert(
      { user_id: userId, role_code: u.role },
      { onConflict: 'user_id,role_code' }
    );
    if (roleErr) {
      console.error(`  ✗ Role assignment failed for "${u.email}":`, roleErr.message);
    } else {
      console.log(`  ✓ Role "${u.role}" assigned to "${u.email}"`);
    }
  }

  console.log('\n✅ Seed complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

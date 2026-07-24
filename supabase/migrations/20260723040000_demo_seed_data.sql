-- ═══════════════════════════════════════════════════════════════
-- DEMO SEED: large, realistic dataset to preview the UI.
-- Does NOT touch groups (keeps the 3 existing: Puissance/Gloire/Sagesse).
-- Creates 4 bergers per group (12 total), ~60 fidèles, recent attendance
-- and a few newcomer registrations. Idempotent (ON CONFLICT DO NOTHING).
-- ═══════════════════════════════════════════════════════════════

SET search_path = public, extensions;

-- 1. Bergers: auth.users + profiles + app_user_roles (4 per group)
DO $$
DECLARE
  grp_puissance uuid := (SELECT id FROM groups WHERE name = 'Puissance' LIMIT 1);
  grp_gloire    uuid := (SELECT id FROM groups WHERE name = 'Gloire' LIMIT 1);
  grp_sagesse   uuid := (SELECT id FROM groups WHERE name = 'Sagesse' LIMIT 1);
  rec record;
  pwd text := crypt('Eglise2026!', gen_salt('bf'));
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('a0000000-0000-4000-8000-000000000001'::uuid, 'Marc',   'Kouadio',    'marc.kouadio@ekklesia.test',    grp_puissance),
      ('a0000000-0000-4000-8000-000000000002'::uuid, 'Awa',    'Bamba',      'awa.bamba@ekklesia.test',       grp_puissance),
      ('a0000000-0000-4000-8000-000000000003'::uuid, 'Yao',    'Kone',       'yao.kone@ekklesia.test',        grp_puissance),
      ('a0000000-0000-4000-8000-000000000004'::uuid, 'Adjoua', 'N''Guessan', 'adjoua.nguessan@ekklesia.test', grp_puissance),
      ('b0000000-0000-4000-8000-000000000001'::uuid, 'Koffi',  'Traore',     'koffi.traore@ekklesia.test',    grp_gloire),
      ('b0000000-0000-4000-8000-000000000002'::uuid, 'Grace',  'Diarra',     'grace.diarra@ekklesia.test',    grp_gloire),
      ('b0000000-0000-4000-8000-000000000003'::uuid, 'Ibrahim','Toure',      'ibrahim.toure@ekklesia.test',   grp_gloire),
      ('b0000000-0000-4000-8000-000000000004'::uuid, 'Fatou',  'Coulibaly',  'fatou.coulibaly@ekklesia.test', grp_gloire),
      ('c0000000-0000-4000-8000-000000000001'::uuid, 'Serge',  'Aka',        'serge.aka@ekklesia.test',       grp_sagesse),
      ('c0000000-0000-4000-8000-000000000002'::uuid, 'Nadege', 'Kouame',     'nadege.kouame@ekklesia.test',   grp_sagesse),
      ('c0000000-0000-4000-8000-000000000003'::uuid, 'Franck', 'Sangare',    'franck.sangare@ekklesia.test',  grp_sagesse),
      ('c0000000-0000-4000-8000-000000000004'::uuid, 'Rachel', 'Yao',        'rachel.yao@ekklesia.test',      grp_sagesse)
    ) t(id, fn, ln, email, gid)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', rec.id, 'authenticated', 'authenticated', rec.email, pwd,
      now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (id, first_name, last_name, role, group_id)
    VALUES (rec.id, rec.fn, rec.ln, 'shepherd', rec.gid)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO app_user_roles (user_id, role_code)
    VALUES (rec.id, 'shepherd')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 2. ~60 fidèles distributed across the 12 bergers
DO $$
DECLARE
  sh uuid[] := ARRAY[
    'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000004'
  ]::uuid[];
  firstn text[] := ARRAY['Jean','Marie','Paul','Awa','Koffi','Adjoua','Yao','Aya','Ibrahim','Fatou','Serge','Grace','Herve','Nadege','Franck','Chantal','Eric','Rachel','Moussa','Estelle'];
  lastn  text[] := ARRAY['Kouassi','Traore','Kone','N''Guessan','Bamba','Diarra','Yao','Aka','Toure','Coulibaly','Kouame','Sangare'];
  quartier text[] := ARRAY['Cocody','Yopougon','Abobo','Marcory','Treichville','Adjame'];
  statuses member_status[] := ARRAY['new','member','member','member','absent_to_relaunch']::member_status[];
  classes class_status[] := ARRAY['none','none','none','tuesday_class','wednesday_class']::class_status[];
  n int;
BEGIN
  -- Only seed if we have not already (avoid duplicates on re-run)
  IF (SELECT count(*) FROM members WHERE shepherd_id = ANY(sh)) = 0 THEN
    FOR n IN 0..59 LOOP
      INSERT INTO members (
        first_name, last_name, phone, shepherd_id, status, current_class,
        residence_location, consecutive_sundays_present, consecutive_absences, last_seen_date
      ) VALUES (
        firstn[1 + (n % 20)],
        lastn[1 + (n % 12)],
        '07' || lpad(((n * 7 + 13) % 100000000)::text, 8, '0'),
        sh[1 + (n % 12)],
        statuses[1 + (n % 5)],
        classes[1 + (n % 5)],
        quartier[1 + (n % 6)],
        (n % 5),
        CASE WHEN n % 5 = 4 THEN 2 ELSE 0 END,
        CURRENT_DATE - (n % 14)
      );
    END LOOP;
  END IF;
END $$;

-- 3. Recent attendance for the seeded members (feeds pointages + stats)
DO $$
DECLARE
  sh uuid[] := ARRAY[
    'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000004'
  ]::uuid[];
  monday date := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  -- Sunday services, last 3 weeks (~75% present)
  INSERT INTO attendance (member_id, date, program_type, is_present)
  SELECT m.id, d, 'sunday_service', (random() < 0.75)
  FROM members m
  CROSS JOIN (VALUES (monday + 6), (monday - 1), (monday - 8)) v(d)
  WHERE m.shepherd_id = ANY(sh)
  ON CONFLICT (member_id, date, program_type) DO NOTHING;

  -- Friday service, last 2 weeks (~60%)
  INSERT INTO attendance (member_id, date, program_type, is_present)
  SELECT m.id, d, 'friday_service', (random() < 0.60)
  FROM members m
  CROSS JOIN (VALUES (monday + 4), (monday - 3)) v(d)
  WHERE m.shepherd_id = ANY(sh)
  ON CONFLICT (member_id, date, program_type) DO NOTHING;

  -- Thursday online, this week (~55%)
  INSERT INTO attendance (member_id, date, program_type, is_present)
  SELECT m.id, monday + 3, 'thursday_online', (random() < 0.55)
  FROM members m
  WHERE m.shepherd_id = ANY(sh)
  ON CONFLICT (member_id, date, program_type) DO NOTHING;

  -- Tuesday class (only eligible members, ~80%)
  INSERT INTO attendance (member_id, date, program_type, is_present)
  SELECT m.id, monday + 1, 'tuesday_class', (random() < 0.80)
  FROM members m
  WHERE m.shepherd_id = ANY(sh) AND m.current_class = 'tuesday_class'
  ON CONFLICT (member_id, date, program_type) DO NOTHING;

  -- Wednesday class (only eligible members, ~80%)
  INSERT INTO attendance (member_id, date, program_type, is_present)
  SELECT m.id, monday + 2, 'wednesday_class', (random() < 0.80)
  FROM members m
  WHERE m.shepherd_id = ANY(sh) AND m.current_class = 'wednesday_class'
  ON CONFLICT (member_id, date, program_type) DO NOTHING;
END $$;

-- 4. Newcomer registrations for the 'new' seeded members (feeds Amis des Nouveaux)
DO $$
DECLARE
  sh uuid[] := ARRAY[
    'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000004'
  ]::uuid[];
BEGIN
  INSERT INTO newcomer_registrations (member_id, registration_date, residence_location, is_self_initiated, assigned_shepherd_id)
  SELECT m.id, CURRENT_DATE - (floor(random() * 20))::int, m.residence_location, true, m.shepherd_id
  FROM members m
  WHERE m.shepherd_id = ANY(sh) AND m.status = 'new'
  ON CONFLICT DO NOTHING;
END $$;

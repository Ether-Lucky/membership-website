-- ============================================================
-- SUPABASE SETUP SCRIPTS
-- Run these after schema.sql in the Supabase SQL Editor
-- ============================================================

-- ─── 1. Storage bucket for avatars ───────────────────────────
-- Do this in the Supabase Dashboard → Storage → New Bucket
-- Name: avatars
-- Public: NO (private bucket, use signed URLs)

-- Storage RLS policies (run in SQL editor)
CREATE POLICY "avatars: members can upload their own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'public'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars: members can update their own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars: admins can read all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR current_user_role() = 'admin'
    )
  );

-- ─── 2. Seed: Create first admin account ─────────────────────
-- Step 1: Create the user via Supabase Auth Dashboard or API
-- Step 2: Run this after the user registers, replacing the email:

DO $$
DECLARE
  v_auth_id UUID;
BEGIN
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = 'admin@yourorg.com'
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Create the auth user first.';
  END IF;

  UPDATE profiles
  SET role   = 'admin',
      status = 'approved'
  WHERE auth_id = v_auth_id;

  RAISE NOTICE 'Admin role assigned to %', v_auth_id;
END $$;

-- ─── 3. Verify RLS is active ─────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles','members','verification_logs','events','event_registrations','attendance');

-- ─── 4. Check indexes ────────────────────────────────────────
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ─── 5. Edge Function deployment (run in terminal) ───────────
-- supabase login
-- supabase link --project-ref YOUR_PROJECT_REF
-- supabase functions deploy approve-member
-- supabase functions deploy verify-member

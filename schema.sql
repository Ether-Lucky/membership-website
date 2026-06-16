-- ============================================================
-- MEMBERSHIP MANAGEMENT SYSTEM — PostgreSQL Schema (Supabase)
-- Version 1 (MVP) + Version 2 Placeholders
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE verification_method AS ENUM ('manual_id', 'qr_scan');

-- ============================================================
-- TABLE: profiles
-- Links to Supabase Auth (auth.users)
-- ============================================================

CREATE TABLE profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id      UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'member',
  status       account_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_profiles_status  ON profiles(status);
CREATE INDEX idx_profiles_role    ON profiles(role);

-- ============================================================
-- TABLE: members
-- Extended member profile data
-- ============================================================

CREATE TABLE members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name        VARCHAR(100) NOT NULL,
  middle_name       VARCHAR(100),
  last_name         VARCHAR(100) NOT NULL,
  birthdate         DATE NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  mobile_number     VARCHAR(20) NOT NULL,
  address           TEXT NOT NULL,
  photo_url         TEXT,
  membership_number VARCHAR(20) UNIQUE,   -- e.g. MEM-2026-000001
  member_since      TIMESTAMPTZ,          -- set when approved
  approved_at       TIMESTAMPTZ,
  approved_by       UUID REFERENCES profiles(id),
  rejected_at       TIMESTAMPTZ,
  rejected_by       UUID REFERENCES profiles(id),
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_profile_id        ON members(profile_id);
CREATE INDEX idx_members_membership_number ON members(membership_number);
CREATE INDEX idx_members_email             ON members(email);
CREATE INDEX idx_members_last_name         ON members(last_name);

-- ============================================================
-- SEQUENCE: membership_number generator
-- MEM-YYYY-NNNNNN (per-year counter)
-- ============================================================

CREATE SEQUENCE membership_seq START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION generate_membership_number()
RETURNS TEXT AS $$
DECLARE
  year_str TEXT := TO_CHAR(NOW(), 'YYYY');
  seq_val  BIGINT := NEXTVAL('membership_seq');
BEGIN
  RETURN 'MEM-' || year_str || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: verification_logs
-- Audit trail for every membership check
-- ============================================================

CREATE TABLE verification_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID REFERENCES members(id) ON DELETE SET NULL,
  membership_number   VARCHAR(20),   -- stored directly in case member is deleted
  verification_method verification_method NOT NULL DEFAULT 'manual_id',
  result              BOOLEAN NOT NULL,   -- true = valid, false = not found / inactive
  ip_address          INET,
  user_agent          TEXT,
  verification_date   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_logs_member_id         ON verification_logs(member_id);
CREATE INDEX idx_verification_logs_verification_date ON verification_logs(verification_date);

-- ============================================================
-- VERSION 2 PLACEHOLDERS — Events & Attendance
-- Not implemented in MVP but schema is ready
-- ============================================================

CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  event_date   TIMESTAMPTZ NOT NULL,
  location     TEXT,
  capacity     INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_registrations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id         UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) NOT NULL DEFAULT 'registered', -- registered, cancelled, waitlisted
  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_event_registrations_event_id  ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_member_id ON event_registrations(member_id);

CREATE TABLE attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_scan       BOOLEAN NOT NULL DEFAULT FALSE,
  notes         TEXT,
  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_attendance_event_id  ON attendance(event_id);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (auth_id, role, status)
  VALUES (NEW.id, 'member', 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: approve_member (called by admin action)
-- ============================================================

CREATE OR REPLACE FUNCTION approve_member(
  p_member_id   UUID,
  p_admin_id    UUID
)
RETURNS TEXT AS $$
DECLARE
  new_membership_number TEXT;
BEGIN
  -- Generate membership number
  new_membership_number := generate_membership_number();

  -- Update member record
  UPDATE members
  SET
    membership_number = new_membership_number,
    member_since      = NOW(),
    approved_at       = NOW(),
    approved_by       = p_admin_id
  WHERE id = p_member_id
    AND membership_number IS NULL;

  -- Update profile status
  UPDATE profiles p
  SET status = 'approved'
  FROM members m
  WHERE m.id = p_member_id
    AND m.profile_id = p.id;

  RETURN new_membership_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: reject_member
-- ============================================================

CREATE OR REPLACE FUNCTION reject_member(
  p_member_id      UUID,
  p_admin_id       UUID,
  p_reason         TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE members
  SET
    rejected_at      = NOW(),
    rejected_by      = p_admin_id,
    rejection_reason = p_reason
  WHERE id = p_member_id;

  UPDATE profiles p
  SET status = 'rejected'
  FROM members m
  WHERE m.id = p_member_id
    AND m.profile_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance        ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's profile id
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "profiles: users can view their own"
  ON profiles FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "profiles: admins can view all"
  ON profiles FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "profiles: system insert only"
  ON profiles FOR INSERT
  WITH CHECK (FALSE); -- Only the trigger (SECURITY DEFINER) may insert

-- MEMBERS policies
CREATE POLICY "members: own profile readable"
  ON members FOR SELECT
  USING (profile_id = current_profile_id());

CREATE POLICY "members: admins can read all"
  ON members FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "members: own profile insertable"
  ON members FOR INSERT
  WITH CHECK (profile_id = current_profile_id());

CREATE POLICY "members: own profile updatable (non-sensitive fields)"
  ON members FOR UPDATE
  USING (profile_id = current_profile_id())
  WITH CHECK (
    profile_id = current_profile_id()
    AND membership_number IS NOT DISTINCT FROM OLD.membership_number
    AND approved_at IS NOT DISTINCT FROM OLD.approved_at
  );

CREATE POLICY "members: admins can update all"
  ON members FOR UPDATE
  USING (current_user_role() = 'admin');

-- VERIFICATION LOGS — public insert, admin read
CREATE POLICY "verification_logs: anyone can insert"
  ON verification_logs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "verification_logs: admins can read"
  ON verification_logs FOR SELECT
  USING (current_user_role() = 'admin');

-- EVENTS — public read published events
CREATE POLICY "events: published visible to all authenticated"
  ON events FOR SELECT
  USING (is_published = TRUE OR current_user_role() = 'admin');

CREATE POLICY "events: admins can manage"
  ON events FOR ALL
  USING (current_user_role() = 'admin');

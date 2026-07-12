-- ============================================================
-- Calisthenics Athlete Platform — Complete Database Schema
-- Run this in your Supabase SQL Editor to initialize the database
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role        TEXT NOT NULL DEFAULT 'user',
  name        TEXT NOT NULL DEFAULT 'User',
  theme       TEXT NOT NULL DEFAULT 'dark',
  xp          INTEGER DEFAULT 0,
  level       INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to profiles" 
  ON profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Calisthenics Progress Table
CREATE TABLE IF NOT EXISTS calisthenics_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name    TEXT NOT NULL,
  path             TEXT NOT NULL,
  mastery_percent  INTEGER DEFAULT 0,
  learned          BOOLEAN DEFAULT FALSE,
  correct_form     BOOLEAN DEFAULT FALSE,
  reps             INTEGER DEFAULT 0,
  target_reps      INTEGER DEFAULT 20,
  sessions_hit     INTEGER DEFAULT 0,
  x3_completed     BOOLEAN DEFAULT FALSE,
  best_performance_date DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, exercise_name)
);

-- Enable RLS for calisthenics_progress
ALTER TABLE calisthenics_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to calisthenics_progress" 
  ON calisthenics_progress FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. PR Logs Table
CREATE TABLE IF NOT EXISTS pr_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise    TEXT NOT NULL,
  value       NUMERIC(8,2) NOT NULL,
  unit        TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for pr_logs
ALTER TABLE pr_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to pr_logs" 
  ON pr_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. PR Milestones Table
CREATE TABLE IF NOT EXISTS pr_milestones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise    TEXT NOT NULL,
  value       NUMERIC(8,2) NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, exercise)
);

-- Enable RLS for pr_milestones
ALTER TABLE pr_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to pr_milestones" 
  ON pr_milestones FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Measurements Table
CREATE TABLE IF NOT EXISTS measurements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg       NUMERIC(5,2),
  waist_cm        NUMERIC(5,2),
  chest_cm        NUMERIC(5,2),
  shoulders_cm    NUMERIC(5,2),
  arm_cm          NUMERIC(5,2), -- arm_relaxed
  arm_flexed_cm   NUMERIC(5,2),
  forearm_cm      NUMERIC(5,2),
  thigh_cm        NUMERIC(5,2),
  calf_cm         NUMERIC(5,2),
  hip_cm          NUMERIC(5,2),
  neck_cm         NUMERIC(5,2),
  wrist_cm        NUMERIC(5,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- Enable RLS for measurements
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to measurements" 
  ON measurements FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Health Logs Table (for Weight tracking)
CREATE TABLE IF NOT EXISTS health_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   NUMERIC(5,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- Enable RLS for health_logs
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to health_logs" 
  ON health_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. log_health_metric Function (RPC)
CREATE OR REPLACE FUNCTION log_health_metric(
  p_profile_id UUID,
  p_date DATE,
  p_metric TEXT,
  p_value NUMERIC
) RETURNS VOID AS $$
BEGIN
  IF p_metric = 'weight_kg' THEN
    INSERT INTO health_logs (profile_id, date, weight_kg)
    VALUES (p_profile_id, p_date, p_value)
    ON CONFLICT (profile_id, date)
    DO UPDATE SET weight_kg = EXCLUDED.weight_kg;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Seed Default Athlete Profile
INSERT INTO profiles (id, role, name)
VALUES ('7a950f24-2c63-47bf-8fbd-197e88ef2f7b', 'asvand', 'Asvand')
ON CONFLICT (id) DO NOTHING;

-- 9. Hardened get_db_size Function (RPC)
CREATE OR REPLACE FUNCTION public.get_db_size()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT SUM(pg_database_size(datname))::BIGINT
  FROM pg_database;
$$;

-- Revoke default execution privileges from PUBLIC (all roles)
REVOKE EXECUTE ON FUNCTION public.get_db_size() FROM PUBLIC;

-- Grant execution privilege exclusively to the anon client role
GRANT EXECUTE ON FUNCTION public.get_db_size() TO anon;

-- ============================================================
-- PLANNED OPTIMIZATIONS (To be run during database migration phase)
-- ============================================================
-- CREATE INDEX IF NOT EXISTS idx_pr_logs_profile_date ON pr_logs(profile_id, date DESC);



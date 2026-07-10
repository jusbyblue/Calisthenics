-- ============================================================
-- Calisthenics Athlete Platform — Supabase Schema Additions
-- Run this in your Supabase SQL Editor to support the new PR Milestones
-- ============================================================

CREATE TABLE IF NOT EXISTS pr_milestones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise    TEXT NOT NULL,
  value       NUMERIC(8,2) NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, exercise)
);

CREATE INDEX IF NOT EXISTS idx_pr_milestones_profile ON pr_milestones(profile_id, exercise);

-- RLS policy for Milestones
ALTER TABLE pr_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own milestones logs" ON pr_milestones
  FOR ALL USING (profile_id::text = current_setting('app.profile_id', TRUE));

-- Migration: race_results soft-delete and audit trail (009-production-hardening)
-- Run this in Supabase SQL Editor before deploying the app changes.
-- This adds deleted_at so we never physically delete rows; "edit" = soft-delete original + insert new row.

-- 1. Add deleted_at column (NULL = current row)
ALTER TABLE race_results
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Optional: partial unique index so only one "current" result per (race_id, driver_id)
--    Uncomment if you want to enforce at DB level (PostgreSQL supports partial unique indexes)
-- CREATE UNIQUE INDEX idx_race_results_current_per_driver
--   ON race_results (race_id, driver_id)
--   WHERE deleted_at IS NULL;

-- 3. Backfill: existing rows stay current (deleted_at already NULL)

-- 4. RLS: keep existing policies. Only admins can INSERT/UPDATE/DELETE.
--    To prevent physical DELETE from the app, you can either:
--    (a) Remove the DELETE policy and use only UPDATE to set deleted_at, or
--    (b) Keep DELETE for admin cleanup and have the app use only UPDATE for "delete".
--    Recommended: keep one policy "Admin full access" for ALL; app will use UPDATE for soft-delete.

COMMENT ON COLUMN race_results.deleted_at IS 'Set when this row is superseded or deleted; NULL = current result.';

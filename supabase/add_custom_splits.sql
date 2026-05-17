-- Run once in Supabase SQL Editor
-- Adds custom split support to expenses

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS split_mode text NOT NULL DEFAULT 'equal'
    CHECK (split_mode IN ('equal', 'custom')),
  ADD COLUMN IF NOT EXISTS custom_splits jsonb;

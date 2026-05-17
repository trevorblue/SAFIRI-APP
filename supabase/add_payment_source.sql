-- Run once in Supabase SQL Editor
-- Adds kitty vs out-of-pocket tracking to expenses
-- Existing expenses default to 'personal' (preserves current settle-up behaviour)

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS payment_source text NOT NULL DEFAULT 'personal'
    CHECK (payment_source IN ('kitty', 'personal'));

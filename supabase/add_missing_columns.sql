-- Run this once in Supabase SQL Editor to fix silent insert failures

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved', 'pending', 'rejected'));

ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS budget numeric(12,2);

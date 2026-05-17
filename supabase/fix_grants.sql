-- Run once in Supabase SQL Editor
-- Gives authenticated (logged-in) users access to the tables.
-- RLS policies still control what each user can see and edit.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_members      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itinerary_items   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items   TO authenticated;

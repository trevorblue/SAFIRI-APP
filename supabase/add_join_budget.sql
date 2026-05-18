-- Allow unauthenticated invite-joiners to set their own budget after joining.
-- The member ID is returned by the existing join_trip() RPC.
-- Run once in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.set_member_budget(p_member_id uuid, p_budget numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE trip_members SET budget = p_budget WHERE id = p_member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_member_budget(uuid, numeric) TO anon;

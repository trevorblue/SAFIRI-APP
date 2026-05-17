-- Run once in Supabase SQL Editor
-- Two SECURITY DEFINER functions so unauthenticated users (invite recipients)
-- can preview a trip and add themselves as a member.
-- The trip UUID is the invite token — 36-char UUID, not guessable.

-- ── 1. Preview trip (read-only, no auth needed) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.trip_preview(p_trip_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v trips%ROWTYPE;
BEGIN
  SELECT * INTO v FROM trips WHERE id = p_trip_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trip not found or no longer active');
  END IF;
  RETURN json_build_object(
    'name',            v.name,
    'destination',     v.settings->>'destination',
    'startDate',       v.start_date,
    'endDate',         v.end_date,
    'budgetPerPerson', v.budget_per_person
  );
END;
$$;

-- ── 2. Join trip (inserts a confirmed member, no auth needed) ─────────────────
CREATE OR REPLACE FUNCTION public.join_trip(p_trip_id uuid, p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip trips%ROWTYPE;
  v_mid  uuid;
BEGIN
  IF length(trim(p_name)) = 0 THEN
    RETURN json_build_object('error', 'Name is required');
  END IF;

  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trip not found or no longer active');
  END IF;

  v_mid := gen_random_uuid();
  INSERT INTO trip_members (id, trip_id, name, confirmed, role)
  VALUES (v_mid, v_trip.id, trim(p_name), true, 'member');

  RETURN json_build_object(
    'memberId',    v_mid,
    'tripName',    v_trip.name,
    'destination', v_trip.settings->>'destination'
  );
END;
$$;

-- Allow anonymous (unauthenticated) calls
GRANT EXECUTE ON FUNCTION public.trip_preview(uuid)       TO anon;
GRANT EXECUTE ON FUNCTION public.join_trip(uuid, text)    TO anon;

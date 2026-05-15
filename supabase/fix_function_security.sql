-- Fix: set search_path to prevent search path hijacking
create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips
    where id = p_trip_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- Fix: revoke anonymous access (functions only needed by authenticated users for RLS)
revoke execute on function public.is_trip_owner(uuid) from public, anon;
revoke execute on function public.is_trip_member(uuid) from public, anon;

grant execute on function public.is_trip_owner(uuid) to authenticated;
grant execute on function public.is_trip_member(uuid) to authenticated;

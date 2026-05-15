-- ============================================================
-- Safiri — Full Database Schema + RLS
-- Run this entire file once in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table public.trips (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,
  start_date         date not null,
  end_date           date not null,
  budget_per_person  numeric(12,2) not null default 0,
  owner_id           uuid references auth.users(id) on delete cascade not null,
  status             text not null default 'active'
                       check (status in ('active', 'complete', 'cancelled')),
  join_token         text unique not null default encode(gen_random_bytes(12), 'hex'),
  settings           jsonb not null default '{}',
  created_at         timestamptz not null default now()
);

create table public.trip_members (
  id          uuid primary key default uuid_generate_v4(),
  trip_id     uuid references public.trips(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  confirmed   boolean not null default false,
  role        text not null default 'member'
                check (role in ('owner', 'member')),
  created_at  timestamptz not null default now()
);

create table public.expenses (
  id              uuid primary key default uuid_generate_v4(),
  trip_id         uuid references public.trips(id) on delete cascade not null,
  description     text not null,
  amount          numeric(12,2) not null,
  category        text not null default 'other',
  date            date,
  paid_by         uuid references public.trip_members(id) on delete set null,
  split_between   uuid[] not null default '{}',
  is_pre_trip     boolean not null default false,
  payment_method  text,
  created_at      timestamptz not null default now()
);

create table public.itinerary_items (
  id           uuid primary key default uuid_generate_v4(),
  trip_id      uuid references public.trips(id) on delete cascade not null,
  day_index    integer not null default 0,
  time         text,
  title        text not null,
  location     text,
  type         text not null default 'activity',
  status       text not null default 'scheduled'
                 check (status in ('scheduled','in-progress','done','cancelled')),
  notes        text,
  activity_id  text,
  cost         numeric(12,2),
  created_at   timestamptz not null default now()
);

create table public.checklist_items (
  id           uuid primary key default uuid_generate_v4(),
  trip_id      uuid references public.trips(id) on delete cascade not null,
  text         text not null,
  done         boolean not null default false,
  assigned_to  uuid references public.trip_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- HELPER FUNCTIONS (used by RLS policies)
-- ============================================================

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.trips
    where id = p_trip_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.trips           enable row level security;
alter table public.trip_members    enable row level security;
alter table public.expenses        enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.checklist_items enable row level security;

-- TRIPS
create policy "Owners full access to their trips"
  on public.trips for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Members can read trips they belong to"
  on public.trips for select
  using (public.is_trip_member(id));

-- TRIP_MEMBERS
create policy "Owners manage members of their trips"
  on public.trip_members for all
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "Members can read co-members of their trips"
  on public.trip_members for select
  using (public.is_trip_member(trip_id));

create policy "Users can insert themselves as members"
  on public.trip_members for insert
  with check (user_id = auth.uid() and role = 'member');

-- EXPENSES
create policy "Owners manage expenses of their trips"
  on public.expenses for all
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "Members can read expenses of their trips"
  on public.expenses for select
  using (public.is_trip_member(trip_id));

-- ITINERARY
create policy "Owners manage itinerary of their trips"
  on public.itinerary_items for all
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "Members can read itinerary of their trips"
  on public.itinerary_items for select
  using (public.is_trip_member(trip_id));

-- CHECKLIST
create policy "Owners manage checklist of their trips"
  on public.checklist_items for all
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "Members can read checklist of their trips"
  on public.checklist_items for select
  using (public.is_trip_member(trip_id));

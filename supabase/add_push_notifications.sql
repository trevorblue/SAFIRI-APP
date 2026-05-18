-- Run once in Supabase SQL Editor.
-- Stores Web Push subscriptions so the Edge Function can send notifications.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id     uuid        REFERENCES public.trips(id) ON DELETE CASCADE,
  endpoint    text        UNIQUE NOT NULL,
  keys        jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── VAPID setup ──────────────────────────────────────────────────────────────
-- 1. Generate VAPID keys:  npx web-push generate-vapid-keys
-- 2. Add to .env:          VITE_VAPID_PUBLIC_KEY=<public_key>
-- 3. Add to Edge Function secrets (Supabase dashboard > Edge Functions > Secrets):
--      VAPID_PUBLIC_KEY  = <public_key>
--      VAPID_PRIVATE_KEY = <private_key>
--      VAPID_MAILTO      = mailto:you@example.com

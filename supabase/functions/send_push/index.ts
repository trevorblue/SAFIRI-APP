// @ts-nocheck
// Supabase Edge Function — send Web Push notifications to all trip subscribers.
// Deploy: supabase functions deploy send_push
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendOnePush(endpoint: string, keys: { p256dh: string; auth: string }, payload: string) {
  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const webpush = await import("npm:web-push@3.6.7")
  webpush.setVapidDetails('mailto:admin@safiri.app', vapidPublic, vapidPrivate)
  await webpush.sendNotification({ endpoint, keys }, payload)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { tripId, title, body } = await req.json()
    if (!tripId || !title) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders })
    }

    // Use service role to bypass RLS — fetch all subscriptions for the trip
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('trip_id', tripId)

    if (error) {
      console.error('fetch subscriptions:', error)
      return new Response(String(error), { status: 500, headers: corsHeaders })
    }

    if (!subs?.length) {
      return new Response('no subscribers', { headers: corsHeaders })
    }

    const payload = JSON.stringify({ title, body: body ?? '' })
    // Send to all subscribers — don't fail the whole request if one push errors
    const results = await Promise.allSettled(
      subs.map(sub => sendOnePush(sub.endpoint, sub.keys, payload))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) console.warn(`${failed}/${subs.length} push(es) failed`)

    return new Response(`sent to ${subs.length - failed}/${subs.length}`, { headers: corsHeaders })
  } catch (err) {
    console.error('send_push error:', err)
    return new Response(String(err), { status: 500, headers: corsHeaders })
  }
})

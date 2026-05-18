// Supabase Edge Function — send a single Web Push notification.
// Deploy: supabase functions deploy send_push
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendPush(endpoint: string, keys: { p256dh: string; auth: string }, payload: string) {
  // Deno-native Web Push using the Web Crypto API
  const sub = { endpoint, keys }
  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!

  // Use the web-push npm package via esm.sh
  const webpush = await import("npm:web-push@3.6.7")
  webpush.setVapidDetails('mailto:admin@safiri.app', vapidPublic, vapidPrivate)
  await webpush.sendNotification(sub, payload)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { endpoint, keys, title, body } = await req.json()
    if (!endpoint || !keys || !title) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders })
    }
    const payload = JSON.stringify({ title, body: body ?? '' })
    await sendPush(endpoint, keys, payload)
    return new Response('ok', { headers: corsHeaders })
  } catch (err) {
    console.error('send_push error:', err)
    return new Response(String(err), { status: 500, headers: corsHeaders })
  }
})

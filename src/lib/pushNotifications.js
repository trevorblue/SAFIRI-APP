import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

export const pushSupported =
  'serviceWorker' in navigator &&
  'PushManager'   in window   &&
  !!VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function isPushSubscribed() {
  if (!pushSupported) return false
  const reg = await navigator.serviceWorker.ready
  return !!(await reg.pushManager.getSubscription())
}

export async function subscribeToPush(userId, tripId) {
  if (!pushSupported || !supabase) return false
  const reg = await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  await supabase.from('push_subscriptions').upsert({
    user_id:  userId,
    trip_id:  tripId ?? null,
    endpoint: sub.endpoint,
    keys:     json.keys,
  }, { onConflict: 'endpoint' })

  return true
}

export async function unsubscribeFromPush(userId) {
  if (!pushSupported || !supabase) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await sub.unsubscribe()
    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', sub.endpoint)
  }
}

// Called from the budget alert logic — fires push to all subscriptions for a trip
export async function triggerBudgetPush(tripId, title, body) {
  if (!supabase) return
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('trip_id', tripId)
  if (!subs?.length) return
  for (const sub of subs) {
    supabase.functions.invoke('send_push', {
      body: { endpoint: sub.endpoint, keys: sub.keys, title, body },
    }).catch(() => {})
  }
}

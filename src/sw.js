import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Safiri', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Safiri', {
      body:  payload.body  ?? '',
      icon:  '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data:  payload.url ? { url: payload.url } : undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url
  if (url) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
        const match = cs.find(c => c.url.startsWith(self.location.origin))
        if (match) { match.focus(); return }
        return self.clients.openWindow(url)
      })
    )
  }
})

/* Chroma Command — cache-first for hashed /assets/* (JS/CSS) after first visit; HTML stays network-fresh. */
'use strict'

const CACHE = 'chroma-assets-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/assets/')) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        try {
          await cache.put(request, response.clone())
        } catch {
          /* quota or opaque — ignore */
        }
      }
      return response
    })
  )
})

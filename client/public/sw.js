const CACHE_NAME = 'bluespace-v1'
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/logo-dark.png',
  '/logo-light.png',
  '/logo-white.png',
]

// Cache shell assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Navigation requests: serve the SPA shell so it works offline
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(request))
    )
    return
  }

  // API calls (/data/): network-first, fall back to cache
  if (url.pathname.startsWith('/data/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/rpc/')) {
    event.respondWith(
      fetch(request).then((response) => {
        // Clone and cache successful GET responses
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => caches.match(request))
    )
    return
  }

  // Static assets: cache-first, fall back to network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  )
})

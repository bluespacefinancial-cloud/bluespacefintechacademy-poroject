const CACHE_NAME = 'bluespace-v3'
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

  // Navigation requests: network-first so deployed updates are immediate, fall back to offline shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone))
          }
          return response
        })
        .catch(() => caches.match('/index.html'))
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

  // Static JS / CSS / assets: cache-first, but NEVER cache or serve text/html for scripts/assets
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          const contentType = cached.headers.get('content-type') || ''
          if (!contentType.includes('text/html')) {
            return cached
          }
          // Purge corrupted cached HTML
          caches.open(CACHE_NAME).then((cache) => cache.delete(request))
        }
        return fetch(request).then((response) => {
          const contentType = response.headers.get('content-type') || ''
          // If server returned text/html for an asset, it was an SPA rewrite fallback (not a script)
          if (contentType.includes('text/html')) {
            return new Response('Asset not found', {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'text/plain' },
            })
          }
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Other static assets (images, fonts, manifest)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})

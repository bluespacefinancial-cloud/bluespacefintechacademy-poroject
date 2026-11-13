import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

// Handle chunk-loading errors gracefully across deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New deployment detected, reloading to latest version...', event)
  const lastReload = sessionStorage.getItem('last_chunk_reload')
  const now = Date.now()
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('last_chunk_reload', String(now))
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" aria-label="Notifications" toastOptions={{
          duration: 3000,
          style: {
            fontSize: '13px',
            fontFamily: 'Manrope, sans-serif',
          },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// PWA offline support. A service worker must never run in development: it
// caches static assets cache-first, so Vite edits (including Tailwind's dark
// mode output) would keep serving the first copy until the cache is cleared.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('BlueSPACE PWA service worker registered:', registration.scope)
          // Proactively check for service worker updates on page load
          registration.update().catch(() => {})
        })
        .catch((error) => {
          console.warn('BlueSPACE PWA service worker registration failed:', error)
        })
    })
  } else {
    // Clean up workers and caches left behind by earlier dev sessions.
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {})
  }
}


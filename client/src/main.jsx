import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

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


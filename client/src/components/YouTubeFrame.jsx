import { useEffect, useRef } from 'react'

let apiPromise = null

/**
 * Extract an 11-character YouTube video id from any of the common URL shapes.
 * Returns null when the URL is not a YouTube link.
 */
export function parseYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return match && match[2].length === 11 ? match[2] : null
}

function loadIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No browser window'))
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous()
      resolve(window.YT)
    }

    const existing = document.getElementById('youtube-iframe-api')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'youtube-iframe-api'
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => {
        apiPromise = null
        reject(new Error('YouTube player failed to load'))
      }
      document.head.appendChild(script)
    }
  })

  return apiPromise
}

/**
 * Thin wrapper around the YouTube IFrame Player API.
 *
 * The native controls stay enabled; this component only reports play state and
 * time so the lesson page can persist progress. Callbacks live in a ref so
 * re-renders do not tear down the player.
 */
export default function YouTubeFrame({
  videoUrl,
  title,
  onTick,
  onPlaying,
  onPaused,
  onEnded,
  onError,
}) {
  const containerRef = useRef(null)
  const callbacksRef = useRef({})

  useEffect(() => {
    callbacksRef.current = { onTick, onPlaying, onPaused, onEnded, onError }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const videoId = parseYouTubeId(videoUrl)
    if (!videoId) {
      callbacksRef.current.onError?.('This lesson does not have a valid YouTube link.')
      return undefined
    }

    let cancelled = false
    let player = null
    let poller = null

    // YT.Player replaces its mount node, so give every player its own child.
    const host = document.createElement('div')
    host.className = 'h-full w-full'
    container.appendChild(host)

    const emitTick = () => {
      if (!player || typeof player.getCurrentTime !== 'function') return
      callbacksRef.current.onTick?.(player.getCurrentTime() || 0, player.getDuration() || 0)
    }

    const stopPoller = () => {
      if (poller) {
        clearInterval(poller)
        poller = null
      }
    }

    const startPoller = () => {
      stopPoller()
      emitTick()
      poller = setInterval(emitTick, 1000)
    }

    loadIframeApi()
      .then((YT) => {
        if (cancelled) return
        player = new YT.Player(host, {
          videoId,
          title,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return
              emitTick()
            },
            onStateChange: (event) => {
              if (cancelled) return
              if (event.data === YT.PlayerState.PLAYING) {
                callbacksRef.current.onPlaying?.()
                startPoller()
              } else if (event.data === YT.PlayerState.PAUSED) {
                stopPoller()
                emitTick()
                callbacksRef.current.onPaused?.()
              } else if (event.data === YT.PlayerState.ENDED) {
                stopPoller()
                emitTick()
                callbacksRef.current.onEnded?.()
              }
            },
            onError: () => {
              callbacksRef.current.onError?.('YouTube could not play this video. It may be private or removed.')
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onError?.('Unable to load the YouTube player.')
      })

    return () => {
      cancelled = true
      stopPoller()
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy()
        } catch {
          // The iframe is already gone; nothing to clean up.
        }
      }
      if (host.parentNode) host.parentNode.removeChild(host)
    }
  }, [videoUrl, title])

  return <div ref={containerRef} className="h-full w-full" />
}

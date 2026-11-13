import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import { Badge } from '../components/ui/badge'
import YouTubeFrame, { parseYouTubeId } from './YouTubeFrame'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronDown,
  Check,
} from 'lucide-react'

const COMPLETION_THRESHOLD = 90 // percent
const SAVE_INTERVAL_MS = 10000 // save progress every 10 seconds

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

/**
 * Default progress store: academy lessons use `lesson_progress`, keyed on
 * `(user_id, lesson_id)`. Partner courses pass their own adapter because they
 * persist to `partner_course_progress`, which has a different shape (no
 * `watch_time_seconds` / `completed_at`, plus a required `course_id`).
 */
const defaultProgressAdapter = {
  async load(userId, lessonId) {
    const { data, error } = await api
      .from('lesson_progress')
      .select('is_completed, completion_percentage')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()
    if (error || !data) return null
    return data
  },
  async save({ userId, lessonId, watchSeconds, percent, completed, position }) {
    await api.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      watch_time_seconds: watchSeconds,
      completion_percentage: percent,
      is_completed: completed,
      last_position_seconds: position,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, lesson_id' })
  },
}

/**
 * Explicit `media_provider` wins; `auto` infers YouTube from the URL. Audio is
 * always native, even when a media_provider is set to youtube on the row.
 */
function resolveMediaProvider(lesson) {
  const configured = lesson.media_provider || 'auto'
  if (configured !== 'auto') return configured
  return lesson.type === 'video' && parseYouTubeId(lesson.video_url) ? 'youtube' : 'self'
}

function inferMediaType(url, isVideo) {
  if (!url || typeof url !== 'string') return isVideo ? 'video/mp4' : 'audio/mpeg'
  const cleanUrl = url.split('?')[0].toLowerCase()
  if (isVideo) {
    if (cleanUrl.endsWith('.webm')) return 'video/webm'
    if (cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.ogv')) return 'video/ogg'
    return 'video/mp4'
  }
  if (cleanUrl.endsWith('.mp3')) return 'audio/mpeg'
  if (cleanUrl.endsWith('.wav')) return 'audio/wav'
  if (cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.oga')) return 'audio/ogg'
  if (cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.aac')) return 'audio/mp4'
  return 'audio/mpeg'
}

export default function MediaPlayer({
  lesson,
  user,
  onComplete,
  readOnly = false,
  progressAdapter = defaultProgressAdapter,
}) {
  const mediaRef = useRef(null)
  const ytRef = useRef(null)
  const saveIntervalRef = useRef(null)
  const isMountedRef = useRef(true)
  const lastYouTubeSaveRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [completionPercent, setCompletionPercent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [speedMenuVisible, setSpeedMenuVisible] = useState(false)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const isVideo = lesson.type === 'video'
  const mediaUrl = lesson.type === 'video' ? lesson.video_url : lesson.audio_url
  const mediaType = inferMediaType(mediaUrl, isVideo)
  const mediaProvider = resolveMediaProvider(lesson)
  const useYouTube = isVideo && mediaProvider === 'youtube'

  const loadProgress = async () => {
    if (!user || !lesson.id) return
    try {
      const profile = await getCurrentProfile()
      if (!profile) return
      const data = await progressAdapter.load(profile.id, lesson.id)
      if (!data) {
        // No progress yet, start from 0
        return
      }
      setCompletionPercent(data.completion_percentage || 0)
      setIsCompleted(data.is_completed || false)
      // Don't auto-seek; let user choose to resume
    } catch {
      // Ignore errors on initial load
    }
  }

  // Initialize: load saved progress
  useEffect(() => {
    isMountedRef.current = true
    ;(async () => {
      await loadProgress()
    })()
    return () => {
      isMountedRef.current = false
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
      if (mediaRef.current) {
        mediaRef.current.pause()
        // Do not clear src here: StrictMode remounts effects in development,
        // and clearing src strands the element with an empty source because
        // React sees an unchanged prop and never re-applies it.
      }
    }
  }, [])

  const saveProgress = useCallback(async (currentTimeVal, isCompletedVal, durationOverride) => {
    if (!user || !lesson.id || !isMountedRef.current) return
    // Staff previewing a lesson must not create student progress rows.
    if (readOnly) return
    const profile = await getCurrentProfile()
    if (!profile) return
    const durationVal = durationOverride || duration || lesson.duration_minutes * 60
    const percent = durationVal > 0 ? (currentTimeVal / durationVal) * 100 : 0
    const completed = isCompletedVal || percent >= COMPLETION_THRESHOLD

    try {
      await progressAdapter.save({
        userId: profile.id,
        lessonId: lesson.id,
        watchSeconds: Math.floor(currentTimeVal),
        percent: Math.round(percent * 100) / 100,
        completed,
        position: Math.floor(currentTimeVal),
      })
    } catch {
      // Ignore save errors; the next tick retries.
    }

    setCompletionPercent(percent)
    setIsCompleted(completed)

    if (completed && !isCompletedVal && onComplete) {
      onComplete(lesson.id)
    }
  }, [user, lesson.id, duration, onComplete, readOnly, progressAdapter])

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration)
      setIsLoaded(true)
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      const ct = mediaRef.current.currentTime
      setCurrentTime(ct)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    saveProgress(duration, true)
  }

  const handlePause = () => {
    setIsPlaying(false)
    saveProgress(currentTime, isCompleted)
  }

  const handlePlay = () => {
    setIsPlaying(true)
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current)
    }
    saveIntervalRef.current = setInterval(() => {
      saveProgress(currentTime, isCompleted)
    }, SAVE_INTERVAL_MS)
  }

  // YouTube reports time through the IFrame API instead of DOM events.
  const handleYouTubeTick = (time, durationValue) => {
    setCurrentTime(time)
    if (durationValue) setDuration(durationValue)
    const dur = durationValue || duration || lesson.duration_minutes * 60
    setCompletionPercent(dur > 0 ? (time / dur) * 100 : 0)

    if (readOnly || isCompleted) return
    const now = Date.now()
    if (now - lastYouTubeSaveRef.current < SAVE_INTERVAL_MS) return
    lastYouTubeSaveRef.current = now
    saveProgress(time, false, dur)
  }

  const handleYouTubeEnded = () => {
    setIsPlaying(false)
    const dur = duration || lesson.duration_minutes * 60
    saveProgress(dur, true, dur)
  }

  const togglePlay = () => {
    if (!mediaRef.current) return
    if (isPlaying) {
      mediaRef.current.pause()
    } else {
      mediaRef.current.play().catch(() => {
        setError('Unable to play media. Please try again.')
      })
    }
  }

  const seekTo = (percent) => {
    if (!mediaRef.current || !duration) return
    const targetTime = (percent / 100) * duration
    mediaRef.current.currentTime = targetTime
    setCurrentTime(targetTime)
  }

  const toggleFullscreen = () => {
    if (useYouTube) {
      const p = ytRef.current
      const host = p?.getIframe?.()
      if (!document.fullscreenElement) {
        host?.requestFullscreen?.().catch?.(() => {})
      } else {
        document.exitFullscreen?.().catch?.(() => {})
      }
      return
    }
    if (!mediaRef.current) return
    if (!document.fullscreenElement) {
      mediaRef.current.requestFullscreen?.().catch?.(() => {})
    } else {
      document.exitFullscreen?.().catch?.(() => {})
    }
  }

  const handleKeyDown = (event) => {
    if (!keyboardActive || readOnly) return
    const { target } = event
    const isTyping =
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    if (isTyping) return

    const key = event.key.toLowerCase()
    if (key === ' ' || key === 'k') {
      event.preventDefault()
      togglePlay()
    } else if (key === 'j') {
      event.preventDefault()
      seekBackward(10)
    } else if (key === 'l') {
      event.preventDefault()
      seekForward(10)
    } else if (key === 'm') {
      event.preventDefault()
      toggleMute()
    } else if (key === 'f') {
      event.preventDefault()
      toggleFullscreen()
    }
  }

  const seekBackward = (seconds) => {
    if (useYouTube) {
      const p = ytRef.current
      if (p) {
        const next = Math.max(0, p.getCurrentTime() - seconds)
        p.seekTo(next)
        setCurrentTime(next)
      }
      return
    }
    if (!mediaRef.current || !duration) return
    const next = Math.max(0, mediaRef.current.currentTime - seconds)
    mediaRef.current.currentTime = next
    setCurrentTime(next)
  }

  const seekForward = (seconds) => {
    if (useYouTube) {
      const p = ytRef.current
      if (p) {
        const dur = p.getDuration() || duration || lesson.duration_minutes * 60
        const next = Math.min(dur, p.getCurrentTime() + seconds)
        p.seekTo(next)
        setCurrentTime(next)
      }
      return
    }
    if (!mediaRef.current || !duration) return
    const next = Math.min(duration, mediaRef.current.currentTime + seconds)
    mediaRef.current.currentTime = next
    setCurrentTime(next)
  }

  useEffect(() => {
    if (!keyboardActive) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyboardActive, handleKeyDown, readOnly])

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (useYouTube) {
      const p = ytRef.current
      if (p) {
        p.setVolume(isMuted ? volume : 0)
      }
      setIsMuted(!isMuted)
      return
    }
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted
      mediaRef.current.volume = isMuted ? 0 : volume
    }
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
    if (useYouTube) {
      const p = ytRef.current
      if (p) {
        p.setVolume(Math.round(vol * 100))
      }
      return
    }
    if (mediaRef.current) {
      mediaRef.current.volume = vol
      mediaRef.current.muted = vol === 0
    }
  }

  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value)
    setPlaybackRate(rate)
    if (useYouTube) {
      const p = ytRef.current
      if (p) {
        p.setPlaybackRate(rate)
      }
      return
    }
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [])

  if (useYouTube) {
    const youtubeDuration = duration || lesson.duration_minutes * 60
    return (
      <div className="w-full rounded-xl overflow-hidden flex flex-col shadow-sm border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-850 relative">
        <div className="relative aspect-video w-full bg-black">
          <YouTubeFrame
            ref={ytRef}
            videoUrl={mediaUrl}
            title={lesson.title || 'Lesson video'}
            onTick={handleYouTubeTick}
            onPlaying={() => setIsPlaying(true)}
            onPaused={() => setIsPlaying(false)}
            onEnded={handleYouTubeEnded}
            onError={(message) => setError(message)}
          />
        </div>
        {error && (
          <p role="alert" className="border-t border-red-200/60 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-deep-600 flex items-center justify-center text-white hover:bg-deep-700 transition-colors shadow-sm"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
            <div className="flex items-center gap-2 min-w-[120px] shrink-0">
              <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={youtubeDuration || 100}
                value={currentTime}
                onChange={(e) => {
                  const pct = parseFloat(e.target.value)
                  const t = (pct / 100) * youtubeDuration
                  ytRef.current?.seekTo(t)
                  setCurrentTime(t)
                }}
                className="w-full accent-deep-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">{formatTime(youtubeDuration)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isVideo && (
                <>
                  <button
                    onClick={toggleMute}
                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 transition-colors"
                    title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                    aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-deep-600"
                  />
                </>
              )}
              <div className="relative group">
                <button
                  onClick={() => setSpeedMenuVisible(!speedMenuVisible)}
                  className="h-8 px-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center gap-1 text-xs font-medium text-gray-700 transition-colors"
                  aria-label="Playback speed"
                >
                  <span>{playbackRate.toFixed(1)}x</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {speedMenuVisible && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg p-1.5 shadow-lg min-w-[80px] border border-gray-100 z-30">
                    {speedOptions.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange({ target: { value: rate.toString() } })}
                        className={`w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-gray-100 transition-colors ${
                          playbackRate === rate ? 'bg-deep-600 text-white font-medium' : 'text-gray-700'
                        }`}
                      >
                        {rate.toFixed(1)}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
            {readOnly ? (
              <Badge variant="secondary" className="text-xs font-medium text-gray-600 border-gray-200">
                Staff preview · progress not recorded
              </Badge>
            ) : (
              <button
                type="button"
                onClick={() => saveProgress(youtubeDuration, true, youtubeDuration)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-deep-600 hover:bg-deep-700 text-white transition-colors"
              >
                {isCompleted ? 'Completed' : 'Mark Lesson Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!mediaUrl) {
    return (
      <div className="rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3 p-10 text-center shadow-sm border border-gray-200/90 bg-white">
        <p className="text-sm font-medium text-gray-900">No playable media is attached to this lesson.</p>
        <p className="text-xs text-gray-500">Use the lesson resource below, or ask your instructor to add the recording.</p>
        {lesson.content_url && (
          <a
            href={lesson.content_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 text-xs font-semibold text-deep-600 underline hover:text-deep-700"
          >
            Open the lesson resource
          </a>
        )}
      </div>
    )
  }

  const mediaElement = isVideo ? (
    <video
      ref={mediaRef}
      src={mediaUrl}
      type={mediaType}
      preload="metadata"
      className="w-full h-full object-center object-cover bg-gray-900"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onPause={handlePause}
      onPlay={handlePlay}
      onError={() => setError('Failed to load media. Please check your connection.')}
      poster={lesson.thumbnail_url || undefined}
    >
      {lesson.caption_url && (
        <track kind="captions" src={lesson.caption_url} srcLang="en" label="English" default />
      )}
    </video>
  ) : (
    <audio
      ref={mediaRef}
      src={mediaUrl}
      type={mediaType}
      preload="metadata"
      className="w-full"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onPause={handlePause}
      onPlay={handlePlay}
      onError={() => setError('Failed to load audio. Please check your connection.')}
    />
  )

  return (
    <div className="w-full rounded-xl overflow-hidden flex flex-col min-h-[400px] max-h-[600px] shadow-sm border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-850 relative">
      {/* Media Area */}
      <div
        className="relative flex-1 w-full bg-black group cursor-pointer"
        onClick={togglePlay}
        onMouseEnter={() => setKeyboardActive(true)}
        onMouseLeave={() => setKeyboardActive(false)}
      >
        {mediaElement}
        {lesson.thumbnail_url && isVideo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        )}
        {/* Play Overlay */}
        {!isLoaded && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center pl-0.5 hover:scale-105 transition-transform cursor-pointer shadow-lg">
              <Play className="w-7 h-7 text-white fill-current ml-0.5" />
            </div>
          </div>
        )}
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Error State */}
        {error && !isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <div className="bg-red-500/90 rounded-lg p-6 max-w-md">
              <h3 className="text-white font-semibold mb-2">Media Load Error</h3>
              <p className="text-red-100 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setIsLoading(true)
                  if (mediaRef.current) mediaRef.current.load()
                }}
                className="mt-3 px-4 py-2 bg-brand-600 text-white rounded text-sm hover:bg-brand-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {/* Playback Controls Overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-black/40 flex flex-col">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between opacity-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-400">
                    {lesson.type === 'video' ? 'Video Lesson' : 'Audio Lesson'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-sm flex items-center justify-between gap-4 opacity-100">
              {/* Left: Play + Time */}
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white hover:bg-brand-500 transition-colors shadow-sm"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-xs text-gray-300">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                    className="w-full accent-brand-600 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    onMouseDown={() => setIsPlaying(false)}
                    onMouseUp={() => {
                      setIsPlaying(true)
                      mediaRef.current?.play()
                    }}
                  />
                  <span className="text-xs text-gray-300">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Center: Progress Bar */}
              <div className="flex-1 flex items-center">
                <div className="flex-1 h-1 bg-gray-600 rounded-lg overflow-hidden group-hover:bg-gray-500 cursor-pointer relative" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = ((e.clientX - rect.left) / rect.width) * 100
                  seekTo(percent)
                }}>
                  <div
                    className="h-full bg-brand-600"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-3">
                {/* Mute */}
                {isVideo && (
                  <>
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors"
                      title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                      aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                  </>
                )}

                {/* Speed */}
                <div className="relative group">
                  <button
                    onClick={() => setSpeedMenuVisible(!speedMenuVisible)}
                    className="h-8 px-2.5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center gap-1 text-xs font-medium text-gray-200 transition-colors"
                    aria-label="Playback speed"
                  >
                    <span>{playbackRate.toFixed(1)}x</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {speedMenuVisible && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white/95 text-gray-900 rounded-lg p-1.5 shadow-lg min-w-[80px] z-30">
                      {speedOptions.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange({ target: { value: rate.toString() } })}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${playbackRate === rate ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {rate.toFixed(1)}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                {isVideo && (
                  <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Completion Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-green-900/90 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">Lesson Complete!</h3>
              <p className="text-green-100 text-sm">You&apos;ve completed this lesson.</p>
            </div>
          </div>
        )}
        {/* Mouse Hide Controls */}
        <div className="absolute inset-0 w-full h-full" onMouseMove={() => {
          setShowControls(true)
          setTimeout(() => setShowControls(false), 3000)
        }} />
      </div>

      {/* Lesson Info Below Media */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-bold shrink-0">
            {lesson.order_index}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">{lesson.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {lesson.type === 'video' ? 'Video lesson' : 'Audio lesson'} • {formatTime(lesson.duration_minutes * 60)}
            </p>
            <div className="flex items-center gap-3">
              <Badge variant={isCompleted ? 'secondary' : 'default'}>
                {isCompleted ? 'Completed' : Math.round(completionPercent) + '% Complete'}
              </Badge>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {formatTime(currentTime)} / {formatTime(duration || lesson.duration_minutes * 60)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

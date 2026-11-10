import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import { Badge } from '../components/ui/badge'
import YouTubeFrame, { parseYouTubeId } from './YouTubeFrame'

const COMPLETION_THRESHOLD = 90 // percent
const SAVE_INTERVAL_MS = 10000 // save progress every 10 seconds

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

/**
 * Explicit `media_provider` wins; `auto` infers YouTube from the URL. Audio is
 * always native, even when a media_provider is set to youtube on the row.
 */
function resolveMediaProvider(lesson) {
  const configured = lesson.media_provider || 'auto'
  if (configured !== 'auto') return configured
  return lesson.type === 'video' && parseYouTubeId(lesson.video_url) ? 'youtube' : 'self'
}

export default function MediaPlayer({
  lesson,
  user,
  onComplete,
  readOnly = false,
}) {
  const mediaRef = useRef(null)
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

  const isVideo = lesson.type === 'video'
  const mediaUrl = lesson.type === 'video' ? lesson.video_url : lesson.audio_url
  const mediaType = lesson.type === 'video' ? 'video/mp4' : 'audio/mpeg'
  const mediaProvider = resolveMediaProvider(lesson)
  const useYouTube = isVideo && mediaProvider === 'youtube'

  const loadProgress = async () => {
    if (!user || !lesson.id) return
    try {
      const profile = await getCurrentProfile()
      if (!profile) return
      const { data, error } = await api
        .from('lesson_progress')
        .select('is_completed, completion_percentage')
        .eq('user_id', profile.id)
        .eq('lesson_id', lesson.id)
        .single()

      if (error || !data) {
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
        mediaRef.current.src = ''
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
      await api
        .from('lesson_progress')
        .upsert({
          user_id: profile.id,
          lesson_id: lesson.id,
          watch_time_seconds: Math.floor(currentTimeVal),
          completion_percentage: Math.round(percent * 100) / 100,
          is_completed: completed,
          last_position_seconds: Math.floor(currentTimeVal),
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, lesson_id' })
    } catch {
      // Ignore upsert errors
    }

    setCompletionPercent(percent)
    setIsCompleted(completed)

    if (completed && !isCompletedVal && onComplete) {
      onComplete(lesson.id)
    }
  }, [user, lesson.id, duration, onComplete, api, readOnly])

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
    if (!mediaRef.current) return
    if (!document.fullscreenElement) {
      mediaRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted
      mediaRef.current.volume = isMuted ? 0 : volume
    }
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
    if (mediaRef.current) {
      mediaRef.current.volume = vol
      mediaRef.current.muted = vol === 0
    }
  }

  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value)
    setPlaybackRate(rate)
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
      <div className="bg-gray-900 text-white rounded-xl overflow-hidden flex flex-col shadow-2xl relative border border-gray-800">
        <div className="relative aspect-video w-full bg-black">
          <YouTubeFrame
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
          <p role="alert" className="border-t border-red-500/30 bg-red-950/60 px-4 py-2 text-xs text-red-200">
            {error}
          </p>
        )}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Video Stream • YouTube</span>
            <span className="text-xs text-gray-400">
              {isCompleted ? 'Completed' : `${Math.round(completionPercent)}% watched`}
            </span>
            {isCompleted && (
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20 font-semibold">
                Completed
              </Badge>
            )}
          </div>
          {readOnly ? (
            <Badge variant="outline" className="text-xs font-medium text-gray-300 border-gray-700">
              Staff preview · progress not recorded
            </Badge>
          ) : (
            <button
              type="button"
              onClick={() => saveProgress(youtubeDuration, true, youtubeDuration)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-deep-600 hover:bg-deep-700 text-white transition-colors"
            >
              {isCompleted ? 'Completed ✓' : 'Mark Lesson Complete'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!mediaUrl) {
    return (
      <div className="bg-gray-900 text-white rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3 p-10 text-center shadow-2xl border border-gray-800">
        <p className="text-sm font-medium text-gray-200">No playable media is attached to this lesson.</p>
        <p className="text-xs text-gray-400">Use the lesson resource below, or ask your instructor to add the recording.</p>
        {lesson.content_url && (
          <a
            href={lesson.content_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-deep-300 underline hover:text-deep-200"
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
      crossOrigin="anonymous"
      preload="metadata"
      className="w-full h-full object-center object-cover bg-gray-900"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onPause={handlePause}
      onPlay={handlePlay}
      onError={() => setError('Failed to load media. Please check your connection.')}
      poster={lesson.thumbnail_url || undefined}
    />
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
    <div className="bg-gray-900 text-white rounded-xl overflow-hidden flex flex-col min-h-[400px] max-h-[600px] shadow-2xl relative">
      {/* Media Area */}
      <div className="relative flex-1 w-full bg-black group cursor-pointer" onClick={togglePlay}>
        {mediaElement}
        {lesson.thumbnail_url && isVideo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        )}
        {/* Play Overlay */}
        {!isLoaded && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center pl-1 hover:scale-105 transition-transform cursor-pointer">
              <svg className="w-6 h-6 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
                  className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l4 4m4-4 4 4m-4 4v4m0 0h4m-4 4l-4-4M4 16v4m0 0h4m-4 4l4-4m-4 4V8m8 0v-4m0 0h-4M4 8l-4 4m4 4 4-4m8 8v-4m0 0h-4m-4 4 4-4m4 4 4-4" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-sm flex items-center justify-between gap-4 opacity-100">
              {/* Left: Play + Time */}
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white hover:bg-brand-500 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                      className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1v1.5a1 1 0 001 1h1.5a1 1 0 011 1v7.5a1 1 0 01-1 1zM17 14a2 2 0 10-4 0h3.586l-1.293-1.293a1 1 0 010-1.414l4.293-4.293a1 1 0 011.414 1.414L17.414 15H17z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 18l2-2m0 0l2-2m-2 2l-2-2m-2 2l-2-2" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.343C7.67 6.165 6 8.388 6 11v3.159c0 .538.214 1.055.595 1.436L4 17h1m6 0a1 1 0 100-2 1 1 0 000 2z" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                  </>
                )}

                {/* Speed */}
                <div className="relative group">
                  <button
                    onClick={() => setSpeedMenuVisible(!speedMenuVisible)}
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm text-gray-200 transition-colors"
                  >
                    <span className="text-xs font-medium">{playbackRate.toFixed(1)}x</span>
                    <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {speedMenuVisible && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white/90 rounded-lg p-2 shadow-lg min-w-[80px]">
                      {speedOptions.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange({ target: { value: rate.toString() } })}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-200 transition-colors ${playbackRate === rate ? 'bg-brand-600 text-white' : 'text-gray-700'}`}
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
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l4 4m4-4 4 4m-4 4v4m0 0h4m-4 4l-4-4M4 16v4m0 0h4m-4 4l4-4m-4 4V8m8 0v-4m0 0h-4M4 8l-4 4m4 4 4-4m8 8v-4m0 0h-4m-4 4 4-4m4 4 4-4" />
                    </svg>
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
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
            {lesson.order_index}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-800 mb-1">{lesson.title}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {lesson.type === 'video' ? 'Video lesson' : 'Audio lesson'} • {formatTime(lesson.duration_minutes * 60)}
            </p>
            <div className="flex items-center gap-3">
              <Badge variant={isCompleted ? 'secondary' : 'default'}>
                {isCompleted ? 'Completed' : Math.round(completionPercent) + '% Complete'}
              </Badge>
              <span className="text-xs font-medium text-gray-600">
                {formatTime(currentTime)} / {formatTime(duration || lesson.duration_minutes * 60)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

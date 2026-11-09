'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeOff, Minimize, Expand, RefreshCw } from 'lucide-react'

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?rel=0`
    : null
}

export function VideoPlayer({
  src,
  title,
  poster,
  className,
  width = 640,
  height = 360,
}) {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(src)

  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [loading, setLoading] = useState(true)

  const togglePlay = () => {
    const video = videoRef.current
    if (video) {
      if (isPlaying) video.pause()
      else video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (video) {
      if (isFullscreen) {
        if (document.exitFullscreen) document.exitFullscreen()
      } else {
        if (video.requestFullscreen) video.requestFullscreen()
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setLoading(false)
    }
    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => setLoading(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = isMuted
    }
  }, [isMuted])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (youtubeEmbedUrl) {
    return (
      <div className={`relative aspect-video w-full bg-black rounded-lg overflow-hidden ${className || ''}`}>
        <iframe
          src={youtubeEmbedUrl}
          title={title || 'Class Recording'}
          className="w-full h-full min-h-[360px] border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const containerClass = `relative bg-black rounded-lg overflow-hidden ${className ?? ''}`

  return (
    <div className={containerClass} style={{ width: isFullscreen ? '100vw' : width, height: isFullscreen ? '100vh' : height }}>
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-cover"
          autoPlay={false}
          controls={false}
          playsInline
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <RefreshCw size={24} className="animate-spin text-white" />
          </div>
        )}
        {!isPlaying && !loading && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 hover:bg-black/30 transition-colors"
          >
            <Play size={64} className="text-white" />
          </button>
        )}
        <div
          className={`absolute bottom-0 left-0 right-0 p-3 z-20 flex items-center gap-2 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <button onClick={togglePlay} className="p-2 text-white hover:text-deep-400">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative group">
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow transform transition-all duration-100 group-hover:w-4 group-hover:h-3"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
            <div className="absolute left-0 top-0 h-full bg-deep-600 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
          </div>
          <span className="text-xs text-white/70">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <button onClick={toggleMute} className="p-2 text-white hover:text-deep-400">
            {isMuted ? <VolumeOff size={20} /> : <Volume2 size={20} />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 text-white hover:text-deep-400">
            {isFullscreen ? <Minimize size={20} /> : <Expand size={20} />}
          </button>
        </div>
        <div className="absolute top-3 left-3 z-30 bg-black/60 px-2 py-1 rounded-md text-xs text-white font-medium backdrop-blur-sm">
          {title || 'Class Video'}
        </div>
      </div>
    </div>
  )
}

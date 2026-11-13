import { useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import { Button } from './ui/button'
import { api } from '../lib/backend'

/**
 * One file-upload control for course authoring.
 *
 * Uploads immediately on selection (no separate "save" step), then hands the
 * returned asset back to the caller to store on a course or lesson row. The
 * backend repeats every check below; these limits exist so authors get instant
 * feedback instead of a wasted 200 MB upload.
 */
const KIND_CONFIG = {
  image: {
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'JPG, PNG or WebP · max 5 MB',
    maxBytes: 5 * 1024 * 1024,
  },
  caption: {
    accept: '.vtt,.srt',
    hint: 'WebVTT or SRT · max 2 MB',
    maxBytes: 2 * 1024 * 1024,
  },
  audio: {
    accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg',
    hint: 'MP3, M4A, WAV or OGG · max 50 MB',
    maxBytes: 50 * 1024 * 1024,
  },
  video: {
    accept: 'video/mp4,video/webm,.mp4,.webm',
    hint: 'MP4 or WebM · max 200 MB',
    maxBytes: 200 * 1024 * 1024,
  },
}

function formatMb(bytes) {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`
}

export default function MediaUpload({
  kind,
  label,
  value,
  onUploaded,
  onClear,
  disabled = false,
  helper,
}) {
  const config = KIND_CONFIG[kind]
  const inputId = useId()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')

    if (file.size > config.maxBytes) {
      setError(`${file.name} is ${formatMb(file.size)}. The limit for this file type is ${formatMb(config.maxBytes)}.`)
      resetInput()
      return
    }

    setUploading(true)
    try {
      const { data, error: uploadError } = await api.uploadMedia(file, kind)
      if (uploadError) {
        setError(uploadError.message || 'That file could not be uploaded.')
        return
      }
      onUploaded(data)
    } catch {
      setError('That file could not be uploaded. Check your connection and try again.')
    } finally {
      setUploading(false)
      resetInput()
    }
  }

  const fileName = (() => {
    if (!value) return ''
    const raw = value.split('/').pop() || value
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  })()

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
          {label}
        </label>
        {helper && <span className="text-[10px] text-muted-foreground">{helper}</span>}
      </div>

      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
          {kind === 'image' ? (
            <img src={value} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          )}
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-xs text-blue-600 dark:text-blue-400 hover:underline"
            title={fileName}
          >
            {fileName || 'Uploaded file'}
          </a>
          {!disabled && onClear && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setError('')
                onClear()
              }}
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <X size={13} className="text-gray-500" />
            </Button>
          )}
        </div>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={config.accept}
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {!disabled && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <Upload size={13} className="mr-1.5" />
            )}
            {uploading ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}
          </Button>
          <span className="text-[10px] text-gray-500">{config.hint}</span>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-[11px] text-red-700">
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

MediaUpload.propTypes = {
  kind: PropTypes.oneOf(Object.keys(KIND_CONFIG)).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onUploaded: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  disabled: PropTypes.bool,
  helper: PropTypes.string,
}

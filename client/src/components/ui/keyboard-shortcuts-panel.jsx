import { useEffect, useCallback } from 'react'
import { X, Keyboard, HelpCircle } from 'lucide-react'
import { Button } from './button'

const SHORTCUTS = [
  {
    section: 'Global',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Open global search' },
      { keys: ['/'], label: 'Open global search (when not typing)' },
      { keys: ['?'], label: 'Show this keyboard shortcuts panel' },
      { keys: ['Escape'], label: 'Close modals, dropdowns, and panels' },
    ],
  },
  {
    section: 'Media Player',
    items: [
      { keys: ['Space', 'K'], label: 'Play / Pause video' },
      { keys: ['J'], label: 'Seek backward 10 seconds' },
      { keys: ['L'], label: 'Seek forward 10 seconds' },
      { keys: ['M'], label: 'Mute / Unmute audio' },
      { keys: ['F'], label: 'Toggle fullscreen' },
    ],
  },
  {
    section: 'Orientation Guide',
    items: [
      { keys: ['ArrowRight'], label: 'Next screen' },
      { keys: ['ArrowLeft'], label: 'Previous screen' },
      { keys: ['Escape'], label: 'Skip / Close orientation' },
    ],
  },
]

export function KeyboardShortcutsPanel({ open, onClose }) {
  const handleKeyDown = useCallback(
    (event) => {
      if (open && event.key === 'Escape') {
        onClose?.()
      }
    },
    [open, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const close = () => {
    onClose?.()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white border border-gray-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
              <Keyboard size={24} />
            </div>
            <div>
              <h3 id="shortcuts-title" className="text-base font-bold text-gray-900 leading-tight">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-gray-500">Press <span className="font-mono">?</span> to reopen this panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close shortcuts panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto max-h-[60vh]">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 px-2">
                {section.section}
              </h4>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.keys.map((key, k) => (
                        <kbd
                          key={k}
                          className="flex items-center justify-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow-xs"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
          <Button type="button" size="sm" onClick={close} className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold">
            <HelpCircle size={13} className="mr-1.5" />
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}

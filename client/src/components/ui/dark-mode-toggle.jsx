import { Moon, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '@/lib/utils'

/**
 * Accessible light/dark switch.
 * - role="switch" + aria-checked exposes the real state to screen readers
 * - the knob and the active icon move together, so the state is unambiguous
 */
export function DarkModeToggle({ className }) {
  const { isDarkMode, toggleDarkMode } = useAuth()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDarkMode}
      aria-label="Dark mode"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleDarkMode}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
        isDarkMode
          ? 'border-deep-700 bg-deep-700 hover:bg-deep-800 dark:border-deep-600 dark:bg-deep-600 dark:hover:bg-deep-500'
          : 'border-gray-300 bg-gray-200 hover:bg-gray-300 dark:border-gray-600',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 flex w-5 items-center justify-center transition-opacity duration-200',
          isDarkMode ? 'opacity-50' : 'opacity-100',
        )}
      >
        <Sun size={11} className="text-amber-600 dark:text-amber-300" />
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 flex w-5 items-center justify-center transition-opacity duration-200',
          isDarkMode ? 'opacity-100' : 'opacity-50',
        )}
      >
        <Moon size={11} className="text-gray-700 dark:text-gray-200" />
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none relative z-10 inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform duration-200 ease-out',
          isDarkMode ? 'translate-x-6' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

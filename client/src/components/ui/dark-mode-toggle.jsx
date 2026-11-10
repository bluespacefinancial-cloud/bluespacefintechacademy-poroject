import { Moon, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from './button'

export function DarkModeToggle({ className }) {
  const { isDarkMode, toggleDarkMode } = useAuth()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
      className={className}
    >
      {isDarkMode ? (
        <Sun size={16} className="text-amber-600 dark:text-amber-400" />
      ) : (
        <Moon size={16} className="text-gray-600 dark:text-gray-400" />
      )}
    </Button>
  )
}

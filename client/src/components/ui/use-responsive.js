import { useEffect, useState } from 'react'

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 }

const isResponsiveObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const resolveWidth = (value) => {
  if (!isResponsiveObject(value)) return value

  if (typeof window === 'undefined') {
    return value.sm ?? value.md ?? value.lg ?? value.xl ?? 196
  }

  const viewport = window.innerWidth
  if (viewport >= BREAKPOINTS.xl && value.xl !== undefined) return value.xl
  if (viewport >= BREAKPOINTS.lg && value.lg !== undefined) return value.lg
  if (viewport >= BREAKPOINTS.md && value.md !== undefined) return value.md
  if (viewport >= BREAKPOINTS.sm && value.sm !== undefined) return value.sm

  return value.sm ?? value.md ?? value.lg ?? value.xl ?? 196
}

export function useResponsive(value) {
  const responsive = isResponsiveObject(value)
  const [current, setCurrent] = useState(() => resolveWidth(value))

  useEffect(() => {
    if (!responsive) return undefined

    const onResize = () => setCurrent(resolveWidth(value))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [responsive, value])

  return responsive ? current : value
}

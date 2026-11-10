import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackToTop({ threshold = 300, className, containerRef }) {
  const [visible, setVisible] = useState(false)
  const btnRef = useRef(null)

  const handleScroll = useCallback(() => {
    const scrollTop = containerRef?.current
      ? containerRef.current.scrollTop
      : window.scrollY
    setVisible(scrollTop > threshold)
  }, [containerRef, threshold])

  useEffect(() => {
    const target = containerRef?.current || window
    target.addEventListener('scroll', handleScroll, { passive: true })
    return () => target.removeEventListener('scroll', handleScroll)
  }, [containerRef, handleScroll])

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!visible) return null

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-6 right-6 z-40 bg-deep-600 text-white rounded-full p-3 shadow-lg hover:bg-deep-700 hover:shadow-xl transition-all transform translate-y-0 hover:translate-y-[-2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2',
        className,
      )}
    >
      <ArrowUp size={18} className="text-white" />
      <span className="sr-only">Back to top</span>
    </button>
  )
}

import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

const Skeleton = React.forwardRef(({ className, variant = 'text', ...props }, ref) => {
  const base = 'animate-pulse rounded-md bg-muted'
  const variants = {
    text: 'h-4 w-full',
    circle: 'h-12 w-12 rounded-full',
    rect: 'h-12 w-full',
    line: 'h-4 w-full',
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn(base, variants[variant], className)}
      {...props}
    />
  )
})
Skeleton.displayName = 'Skeleton'
Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['text', 'circle', 'rect', 'line']),
}

export { Skeleton }

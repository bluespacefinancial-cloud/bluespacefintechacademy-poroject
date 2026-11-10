import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-deep-200 text-deep-700 bg-deep-50/50 dark:border-blue-800/60 dark:text-blue-300 dark:bg-blue-950/40',
        secondary: 'border-gray-200 text-gray-700 bg-gray-50/50 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-800/60',
        destructive: 'border-red-200 text-red-700 bg-red-50/50 dark:border-red-900/60 dark:text-red-300 dark:bg-red-950/40',
        outline: 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-800/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
))
Badge.displayName = 'Badge'

export { Badge, badgeVariants }

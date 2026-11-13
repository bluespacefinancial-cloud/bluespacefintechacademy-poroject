import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white border-transparent shadow-xs',
        primary: 'bg-blue-600 text-white border-transparent shadow-xs',
        secondary: 'bg-slate-700 text-white border-transparent shadow-xs',
        destructive: 'bg-rose-600 text-white border-transparent shadow-xs',
        success: 'bg-emerald-600 text-white border-transparent shadow-xs',
        warning: 'bg-amber-500 text-slate-950 font-bold border-transparent shadow-xs',
        info: 'bg-sky-600 text-white border-transparent shadow-xs',
        purple: 'bg-purple-600 text-white border-transparent shadow-xs',
        outline: 'border border-border bg-card text-foreground font-semibold shadow-xs',
        solidBlue: 'bg-blue-600 text-white border-transparent shadow-xs',
        solidEmerald: 'bg-emerald-600 text-white border-transparent shadow-xs',
        solidAmber: 'bg-amber-500 text-slate-950 font-bold border-transparent shadow-xs',
        solidRose: 'bg-rose-600 text-white border-transparent shadow-xs',
        solidSlate: 'bg-slate-700 text-white border-transparent shadow-xs',
        solidPurple: 'bg-purple-600 text-white border-transparent shadow-xs',
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

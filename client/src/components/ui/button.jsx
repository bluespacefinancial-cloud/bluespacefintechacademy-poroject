import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90 shadow-sm font-semibold',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 shadow-sm font-semibold',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground text-foreground dark:hover:bg-muted/60 dark:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline dark:text-blue-400',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...rest}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }

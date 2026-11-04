import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

const ScrollArea = ScrollAreaPrimitive.Root

const ScrollBar = ScrollAreaPrimitive.Scrollbar

const ScrollAreaButton = ScrollAreaPrimitive.Button

const ScrollView = ({ className, children, ...props }) => {
  return (
    <ScrollAreaPrimitive.Viewport
      className={cn('vertical:scrollbar-gutter', className)}
      {...props}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
  )
}

const Scrollbar = ({ className, orientation, children, ...props }) => {
  return (
    <ScrollBar
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors',
        orientation === 'horizontal'
          ? 'h-2 w-full'
          : 'w-2 h-full',
        className
      )}
      {...props}
    >
      <ScrollAreaButton
        className={cn(
          'flex-1 bg-accent data-[hover=bg-accent]/80',
          orientation === 'horizontal' ? 'h-full w-2' : 'h-2 w-full'
        )}
        {...props}
      >
        {children}
      </ScrollAreaButton>
    </ScrollBar>
  )
}

export { ScrollArea, ScrollAreaButton, ScrollView, Scrollbar }

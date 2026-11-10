import { cn } from '@/lib/utils'

// Horizontal / vertical spacing lives on AppLayout's <main> so the header,
// content and footer all share one gutter. This wrapper only controls width.
export function PageContainer({ children, className, fullWidth = true }) {
  return (
    <div
      className={cn(
        fullWidth ? 'w-full' : 'max-w-7xl mx-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}

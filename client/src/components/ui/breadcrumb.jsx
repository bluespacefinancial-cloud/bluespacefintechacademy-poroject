import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const BreadcrumbItem = ({ to, label, isLast, className }) => {
  if (isLast) {
    return (
      <span
        className={cn('text-xs text-gray-500', className)}
        aria-current="page"
      >
        {label}
      </span>
    )
  }
  return (
    <Link
      to={to}
      className={cn('text-xs text-deep-600 hover:text-deep-700 hover:underline transition-colors', className)}
    >
      {label}
    </Link>
  )
}

export function Breadcrumb({ items, className }) {
  const location = useLocation()
  const hasItems = items && items.length > 0
  if (!hasItems) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-wide mb-1', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const label = item.label || item.title
        const to = item.to || item.href

        if (!isLast && to) {
          return (
            <>
              <BreadcrumbItem to={to} label={label} isLast={false} />
              <ChevronRight size={12} className="text-gray-400 shrink-0 mx-0.5" aria-hidden="true" />
            </>
          )
        }
        return <BreadcrumbItem key={index} label={label} isLast={true} />
      })}
      <span className="visually-hidden">You are here: {location.pathname}</span>
    </nav>
  )
}

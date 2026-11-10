import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 p-8 text-center sm:text-left', className)}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto sm:mx-0 shrink-0">
          <Icon size={24} className="text-gray-400" aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 min-w-0 mx-auto sm:mx-0">
        <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-4 flex items-center justify-center sm:justify-start w-full">
          {action}
        </div>
      )}
    </div>
  )
}

export function PageEmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('min-h-[400px] flex flex-col items-center justify-center py-20', className)}>
      <EmptyState icon={Icon} title={title} description={description} action={action} />
    </div>
  )
}

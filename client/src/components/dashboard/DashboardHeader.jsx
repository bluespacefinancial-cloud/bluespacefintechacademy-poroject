import PropTypes from 'prop-types'
import { HelpCircle } from 'lucide-react'
import { Button } from '../ui/button'

export default function DashboardHeader({
  title,
  subtitle,
  actions,
  dataTour,
  onStartTour,
  role,
}) {
  return (
    <header
      data-tour={dataTour}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-1"
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {onStartTour && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStartTour}
            className="text-xs text-gray-600 hover:text-deep-600 border-gray-200"
            title="Start interactive tour"
          >
            <HelpCircle size={14} className="mr-1.5" />
            Tour guide
          </Button>
        )}
        {actions}
      </div>
    </header>
  )
}

DashboardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
  dataTour: PropTypes.string,
  onStartTour: PropTypes.func,
  role: PropTypes.string,
}

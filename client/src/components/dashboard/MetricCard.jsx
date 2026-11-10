import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Card } from '../ui/card'

export default function MetricCard({
  label,
  value,
  icon: Icon,
  helper,
  to,
  dataTour,
  className = '',
}) {
  const content = (
    <div className="p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 flex items-center justify-center text-deep-600 dark:text-deep-400 shrink-0"
            aria-hidden="true"
          >
            <Icon size={17} strokeWidth={2} />
          </div>
        )}
      </div>
      {helper && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-400 font-normal truncate">
          {helper}
        </p>
      )}
    </div>
  )

  const cardClasses = `border border-gray-200/90 dark:border-gray-800 bg-card rounded-xl shadow-sm transition-colors ${
    to ? 'hover:border-deep-600/50 dark:hover:border-deep-500/50 cursor-pointer' : ''
  } ${className}`

  if (to) {
    return (
      <Card data-tour={dataTour} className={cardClasses}>
        <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 rounded-xl">
          {content}
        </Link>
      </Card>
    )
  }

  return (
    <Card data-tour={dataTour} className={cardClasses}>
      {content}
    </Card>
  )
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
  icon: PropTypes.elementType,
  helper: PropTypes.string,
  to: PropTypes.string,
  dataTour: PropTypes.string,
  className: PropTypes.string,
}

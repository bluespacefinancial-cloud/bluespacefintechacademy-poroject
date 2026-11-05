import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'

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
    <CardContent className="p-5 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-none">
            {value}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
            {label}
          </p>
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-deep-600 shrink-0"
            aria-hidden="true"
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      {helper && (
        <p className="mt-3 text-xs text-gray-500 font-normal">
          {helper}
        </p>
      )}
    </CardContent>
  )

  const cardClasses = `border border-gray-200/90 bg-white rounded-xl shadow-sm transition-colors ${
    to ? 'hover:border-deep-600/50 cursor-pointer' : ''
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

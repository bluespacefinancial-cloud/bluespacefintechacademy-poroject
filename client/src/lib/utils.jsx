import * as React from 'react'

export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

export function WithAspectRatio({ ratio, className, style, children }) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ ...style, position: 'relative', ...(ratio ? { paddingBottom: `${1 / ratio * 100}%` } : {}) }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              className: cn('absolute inset-0 w-full h-full object-cover', child.props.className),
            })
          : child
      )}
    </div>
  )
}

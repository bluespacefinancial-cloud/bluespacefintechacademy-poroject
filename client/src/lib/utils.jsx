import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
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

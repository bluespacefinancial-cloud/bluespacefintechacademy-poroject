import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import { Card, CardContent, CardHeader } from './card'

const SkeletonCard = React.forwardRef(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn('animate-pulse', className)}
    {...props}
  >
    <CardHeader>
      <Skeleton className="h-4 w-3/4 mb-2" variant="text" />
      <Skeleton className="h-4 w-1/2" variant="text" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-full mb-3" variant="rect" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" variant="text" />
        <Skeleton className="h-4 w-1/3" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
      </div>
    </CardContent>
  </Card>
))
SkeletonCard.displayName = 'SkeletonCard'
SkeletonCard.propTypes = {
  className: PropTypes.string,
}

export { SkeletonCard }

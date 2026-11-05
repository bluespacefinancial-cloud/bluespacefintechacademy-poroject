export function Tabs({ children, ...props }) {
  return <div className="flex" {...props}>{children}</div>
}

export function TabsList({ children, ...props }) {
  return <div className="flex -space-x-px" {...props}>{children}</div>
}

export function TabsTrigger({ className, ...props }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-deep-100 data-[state=active]:text-deep-600',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

export function TabsContent({ className, children, ...props }) {
  return (
    <div className={[
      'rounded-md border border-deep-200 bg-white p-6',
      className,
    ].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

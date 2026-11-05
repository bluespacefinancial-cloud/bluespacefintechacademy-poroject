export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) {
  return (
    <hr
      className={[
        'relative flex w-full shrink-0 border-deep-200',
        orientation === 'horizontal' ? 'h-[px] w-full' : 'h-full w-[px]',
        className,
      ].filter(Boolean).join(' ')}
      aria-orientation={orientation}
      {...(decorative ? { 'aria-hidden': true } : {})}
      {...props}
    />
  )
}

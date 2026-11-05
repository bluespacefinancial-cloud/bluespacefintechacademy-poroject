export function Slider({ className, ...props }) {
  return (
    <input
      type="range"
      className={[
        'relative touch-none w-full h-2 select-none items-center rounded-full bg-deep-200',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

import { Checkbox } from '@base-ui/react/checkbox'
import { cn } from '@/lib/utils'

function CheckboxRoot({
  className,
  ...props
}: Checkbox.Root.Props) {
  return (
    <Checkbox.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-md border border-border bg-card transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 data-[highlighted]:border-accent data-[highlighted]:ring-2 data-[highlighted]:ring-accent/30',
        className,
      )}
      {...props}
    />
  )
}

function CheckboxIndicator({
  className,
  ...props
}: Checkbox.Indicator.Props) {
  return (
    <Checkbox.Indicator
      data-slot="checkbox-indicator"
      className={cn('flex items-center justify-center text-primary', className)}
      {...props}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        <path d="M3 8.5L6.5 12L13 4" />
      </svg>
    </Checkbox.Indicator>
  )
}

export { CheckboxRoot as Checkbox, CheckboxIndicator }

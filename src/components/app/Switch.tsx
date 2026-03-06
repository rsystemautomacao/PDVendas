interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  leftLabel?: string
  rightLabel?: string
  id?: string
}

export function Switch({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  id = `switch-${Math.random().toString(36).slice(2)}`,
}: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      {leftLabel && (
        <label htmlFor={id} className="text-sm text-text-secondary">
          {leftLabel}
        </label>
      )}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${checked ? 'bg-primary' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
      {(leftLabel || rightLabel) && (
        <span className="text-sm font-medium text-text-primary">
          {checked ? rightLabel : leftLabel}
        </span>
      )}
    </div>
  )
}

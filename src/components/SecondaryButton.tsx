import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  fullWidth?: boolean
}

export function SecondaryButton({
  children,
  fullWidth = false,
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      className={`
        inline-flex min-h-button items-center justify-center gap-2 rounded-button
        border-2 border-primary bg-white px-6 font-semibold text-primary
        transition-colors hover:bg-primary-pale focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-70
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

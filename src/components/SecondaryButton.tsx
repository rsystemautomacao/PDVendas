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
        border border-gray-200 bg-white px-6 font-semibold text-gray-700
        transition-all duration-200 hover:bg-gray-50 hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

export function PrimaryButton({
  children,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={`
        inline-flex min-h-button items-center justify-center gap-2 rounded-button
        bg-gradient-to-r from-primary to-blue-700 px-6 font-semibold text-white
        shadow-sm shadow-primary/20
        transition-all duration-200 hover:shadow-md hover:shadow-primary/30 hover:brightness-110
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
          <span className="sr-only">Carregando</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

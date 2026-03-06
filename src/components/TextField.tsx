import { type InputHTMLAttributes, type ReactNode, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  error?: string
  /** Para senha: mostra botão de alternar visibilidade (usa rightIcon se não for tipo password) */
  type?: 'text' | 'email' | 'password' | 'number'
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, leftIcon, rightIcon, error, type = 'text', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    const inputId = id || props.name || `field-${Math.random().toString(36).slice(2)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 flex h-5 w-5 items-center justify-center text-text-secondary"
              aria-hidden
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`
              w-full min-h-[44px] rounded-input border border-gray-300 bg-white py-2.5 pr-10
              text-text-primary placeholder:text-text-muted
              transition-colors focus:border-primary focus:bg-primary-pale/30 focus:outline-none focus:ring-2 focus:ring-primary/20
              disabled:bg-gray-100 disabled:opacity-70
              ${leftIcon ? 'pl-11' : 'pl-4'}
              ${(rightIcon || (isPassword && true)) ? 'pr-11' : 'pr-4'}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 flex h-5 w-5 items-center justify-center text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          {!isPassword && rightIcon && (
            <span
              className="absolute right-3 flex h-5 w-5 items-center justify-center text-text-secondary"
              aria-hidden
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

TextField.displayName = 'TextField'

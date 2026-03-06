import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FormFieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  id?: string
  error?: string
}

export function FormFieldInput({ label, id, error, ...props }: FormFieldInputProps) {
  const inputId = id || props.name || `field-${Math.random().toString(36).slice(2)}`
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        className={`
          w-full border-0 border-b border-gray-300 bg-transparent py-2 text-text-primary
          placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-0
          ${error ? 'border-red-500' : ''}
        `}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}

interface FormFieldTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string
  id?: string
  error?: string
}

export function FormFieldTextarea({ label, id, error, ...props }: FormFieldTextareaProps) {
  const inputId = id || props.name || `field-${Math.random().toString(36).slice(2)}`
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-text-primary">
        {label}
      </label>
      <textarea
        id={inputId}
        className={`
          w-full border-0 border-b border-gray-300 bg-transparent py-2 text-text-primary
          placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-0
          ${error ? 'border-red-500' : ''}
        `}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}

import { X, Check } from 'lucide-react'

interface FooterActionsProps {
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
  cancelLabel?: string
  loading?: boolean
}

export function FooterActions({
  onCancel,
  onSave,
  saveLabel = 'SALVAR',
  cancelLabel = 'CANCELAR',
  loading = false,
}: FooterActionsProps) {
  return (
    <div className="fixed bottom-0 right-0 z-20 flex gap-2 p-4">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex min-h-button items-center gap-2 rounded-button border-0 bg-red-600 px-6 font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <X className="h-5 w-5" />
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={loading}
        className="inline-flex min-h-button items-center gap-2 rounded-button border-0 bg-primary px-6 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Check className="h-5 w-5" />
        )}
        {saveLabel}
      </button>
    </div>
  )
}

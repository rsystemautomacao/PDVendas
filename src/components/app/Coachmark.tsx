import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'meupdv_hide_client_tip'

interface CoachmarkProps {
  targetId?: string
  title?: string
  text: string
  dismissLabel?: string
  onDismiss?: () => void
}

export function Coachmark({
  text,
  dismissLabel = 'Não exibir mais',
  onDismiss,
}: CoachmarkProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return
      setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const handleClose = () => {
    setVisible(false)
    onDismiss?.()
  }

  const handleDontShowAgain = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setVisible(false)
    onDismiss?.()
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Dica"
      className="absolute left-1/2 top-0 z-10 w-full max-w-md -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{ marginBottom: '8px' }}
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-2 top-2 rounded p-1 text-text-muted hover:bg-gray-100 hover:text-text-primary"
        aria-label="Fechar dica"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 text-sm text-text-primary">{text}</p>
      <button
        type="button"
        onClick={handleDontShowAgain}
        className="mt-3 text-sm font-medium text-primary hover:underline"
      >
        {dismissLabel}
      </button>
    </div>
  )
}

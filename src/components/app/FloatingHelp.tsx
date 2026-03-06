import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface FloatingHelpProps {
  badgeCount?: number
  tutorialsLabel?: string
  tutorialsCount?: string
}

export function FloatingHelp({
  badgeCount = 2,
  tutorialsLabel = 'Tutoriais Guiados',
  tutorialsCount = '0/4',
}: FloatingHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg"
          role="dialog"
          aria-label="Ajuda"
        >
          <p className="text-sm text-text-primary">Conteúdo de ajuda (em construção)</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Fechar
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary shadow hover:bg-primary-pale focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {tutorialsLabel} {tutorialsCount}
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Ajuda"
      >
        <HelpCircle className="h-7 w-7" />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {badgeCount}
          </span>
        )}
      </button>
    </div>
  )
}

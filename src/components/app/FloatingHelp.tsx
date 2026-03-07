import { useState } from 'react'
import { HelpCircle, MessageCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FloatingHelp() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          className="w-72 rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-sm p-5 shadow-xl animate-scale-in"
          role="dialog"
          aria-label="Ajuda"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Precisa de ajuda?</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <Link
              to="/app/ajuda"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Central de Ajuda</p>
                <p className="text-xs text-gray-400">FAQ e tutoriais</p>
              </div>
            </Link>
            <a
              href="https://wa.me/5511943950503"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Falar com suporte</p>
                <p className="text-xs text-gray-400">WhatsApp</p>
              </div>
            </a>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Ajuda"
      >
        {open ? <X className="h-6 w-6" /> : <HelpCircle className="h-7 w-7" />}
      </button>
    </div>
  )
}

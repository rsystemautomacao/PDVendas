import { MessageCircle } from 'lucide-react'

export function ChatWidget() {
  return (
    <div className="fixed bottom-24 right-6 z-20 flex max-w-[280px] flex-col gap-2 sm:bottom-28 print:hidden">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Olá! 👋</p>
            <p className="mt-1 text-sm text-text-secondary">
              Caso tenha alguma dúvida, estou aqui para auxiliar.
            </p>
            <p className="mt-2 text-xs text-text-muted">Mia - MeuPDV • Agora</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Falar com um consultor
        </button>
      </div>
    </div>
  )
}

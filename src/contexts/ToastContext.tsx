import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { generateId } from '../utils/storage'
import type { Toast } from '../types'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastContextType {
  toasts: Toast[]
  sucesso: (mensagem: string) => void
  erro: (mensagem: string) => void
  alerta: (mensagem: string) => void
  info: (mensagem: string) => void
  remover: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((tipo: Toast['tipo'], mensagem: string, duracao = 4000) => {
    const id = generateId()
    setToasts(prev => [...prev, { id, tipo, mensagem, duracao }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duracao)
  }, [])

  const sucesso = useCallback((m: string) => addToast('sucesso', m), [addToast])
  const erro = useCallback((m: string) => addToast('erro', m, 6000), [addToast])
  const alerta = useCallback((m: string) => addToast('alerta', m, 5000), [addToast])
  const info = useCallback((m: string) => addToast('info', m), [addToast])
  const remover = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const icons = {
    sucesso: <CheckCircle size={20} />,
    erro: <XCircle size={20} />,
    alerta: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  }

  const colors = {
    sucesso: 'bg-green-50 border-green-400 text-green-800',
    erro: 'bg-red-50 border-red-400 text-red-800',
    alerta: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  }

  return (
    <ToastContext.Provider value={{ toasts, sucesso, erro, alerta, info, remover }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in ${colors[toast.tipo]}`}
            role="alert"
          >
            {icons[toast.tipo]}
            <span className="flex-1 text-sm font-medium">{toast.mensagem}</span>
            <button
              onClick={() => remover(toast.id)}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

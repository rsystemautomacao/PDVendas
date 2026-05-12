import { useNavigate } from 'react-router-dom'
import { AlertTriangle, X, CreditCard } from 'lucide-react'

interface Props {
  diasRestantes: number
  onDismiss: () => void
}

export function AssinaturaAlerta({ diasRestantes, onDismiss }: Props) {
  const navigate = useNavigate()

  const urgente = diasRestantes <= 1

  const titulo = urgente
    ? '⚠️ Assinatura vence amanhã!'
    : `Assinatura vence em ${diasRestantes} dias`

  const mensagem = urgente
    ? 'Seu acesso será bloqueado em breve. Renove agora para não perder o acesso ao sistema.'
    : diasRestantes <= 3
    ? 'Renove sua assinatura para garantir acesso contínuo ao sistema.'
    : 'Sua assinatura está próxima do vencimento. Renove com antecedência.'

  const corBorda = urgente ? 'border-red-400' : diasRestantes <= 3 ? 'border-orange-400' : 'border-amber-400'
  const corFundo = urgente ? 'bg-red-50' : diasRestantes <= 3 ? 'bg-orange-50' : 'bg-amber-50'
  const corTexto = urgente ? 'text-red-800' : diasRestantes <= 3 ? 'text-orange-800' : 'text-amber-800'
  const corBotao = urgente
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : diasRestantes <= 3
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-amber-500 hover:bg-amber-600 text-white'

  const handleRenovar = () => {
    onDismiss()
    navigate('/app/config/assinatura')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none">
      <div
        className={`
          pointer-events-auto w-full max-w-md rounded-2xl border-2 shadow-xl
          ${corBorda} ${corFundo} ${corTexto}
          animate-slide-in
        `}
      >
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle size={22} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{titulo}</p>
            <p className="text-sm mt-0.5 opacity-90">{mensagem}</p>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleRenovar}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${corBotao}`}
          >
            <CreditCard size={15} />
            Renovar Agora
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
          >
            Lembrar depois
          </button>
        </div>
      </div>
    </div>
  )
}

import { RefreshCw } from 'lucide-react'

interface Props {
  onUpdate: () => void
}

export function UpdateBanner({ onUpdate }: Props) {
  return (
    <div className="bg-indigo-600 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
      <RefreshCw size={14} className="shrink-0 animate-spin-slow" />
      <span>Nova versão disponível.</span>
      <button
        onClick={onUpdate}
        className="font-bold underline underline-offset-2 hover:no-underline transition-all"
      >
        Atualizar agora
      </button>
    </div>
  )
}

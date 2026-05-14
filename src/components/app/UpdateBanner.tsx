import { RefreshCw, Download } from 'lucide-react'

interface Props {
  onUpdate: () => void
}

export function UpdateBanner({ onUpdate }: Props) {
  return (
    <div className="bg-indigo-600 text-white py-3 px-4 sm:py-2">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="shrink-0 animate-spin-slow" />
          <span className="text-sm sm:text-sm font-medium">Nova versao disponivel!</span>
        </div>
        <button
          onClick={onUpdate}
          className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold text-base sm:text-sm rounded-xl px-6 py-3 sm:py-1.5 sm:px-4 sm:rounded-lg min-h-[48px] sm:min-h-0 shadow-md sm:shadow-none active:scale-95 transition-transform w-full sm:w-auto"
        >
          <Download size={18} className="sm:hidden shrink-0" />
          Atualizar agora
        </button>
      </div>
    </div>
  )
}

import { Globe } from 'lucide-react'

interface LogoMeuPDVProps {
  showSubtitle?: boolean
  className?: string
}

export function LogoMeuPDV({ showSubtitle = true, className = '' }: LogoMeuPDVProps) {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white" aria-hidden>
          <Globe className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold text-text-primary">MeuPDV</span>
      </div>
      {showSubtitle && (
        <span className="text-xs text-text-secondary">
          CONTROLE DE ESTOQUE, VENDAS E FINANCEIRO
        </span>
      )}
    </div>
  )
}

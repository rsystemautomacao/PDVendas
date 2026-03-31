interface LogoMeuPDVProps {
  showSubtitle?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LogoMeuPDV({ showSubtitle = true, className = '', size = 'md' }: LogoMeuPDVProps) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-xl', sub: 'text-xs' },
    lg: { box: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-2xl', sub: 'text-xs' },
  }
  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex ${s.box} items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-700 text-white shadow-lg shadow-primary/25`} aria-hidden>
          <svg viewBox="0 0 24 24" className={s.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <span className={`${s.text} font-bold text-text-primary`}>MeuPDV</span>
      </div>
      {showSubtitle && (
        <span className={`${s.sub} font-medium tracking-wide text-text-secondary`}>
          CONTROLE DE ESTOQUE, VENDAS E FINANCEIRO
        </span>
      )}
    </div>
  )
}

interface LogoMeuPDVProps {
  showSubtitle?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LogoMeuPDV({ showSubtitle = true, className = '', size = 'md' }: LogoMeuPDVProps) {
  const sizes = {
    sm: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-2xl', sub: 'text-[9px]' },
    md: { box: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-4xl', sub: 'text-[10px]' },
    lg: { box: 'h-16 w-16', icon: 'h-8 w-8', text: 'text-5xl', sub: 'text-[10px]' },
  }
  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`flex ${s.box} items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-700 text-white shadow-xl shadow-primary/25`} aria-hidden>
        <svg viewBox="0 0 24 24" className={s.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </div>
      <h1 className={`${s.text} font-black tracking-tight text-center`}>
        <span className="text-primary">MEU</span>
        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> PDV</span>
      </h1>
      {showSubtitle && (
        <p className={`${s.sub} font-bold tracking-[0.25em] text-gray-400 uppercase`}>
          Sistema de Gestao Comercial
        </p>
      )}
    </div>
  )
}
